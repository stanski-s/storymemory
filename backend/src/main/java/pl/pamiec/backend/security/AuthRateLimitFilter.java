package pl.pamiec.backend.security;

import com.bucket4j.BucketConfiguration;
import com.bucket4j.distributed.ExpirationAfterWriteStrategy;
import com.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketProbe;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AuthRateLimitFilter.class);

    // login: 10 req/min per IP
    private static final BucketConfiguration LOGIN_CONFIG = BucketConfiguration.builder()
            .addLimit(Bandwidth.builder().capacity(10).refillGreedy(10, Duration.ofMinutes(1)).build())
            .build();

    // register: 5 req/min per IP
    private static final BucketConfiguration REGISTER_CONFIG = BucketConfiguration.builder()
            .addLimit(Bandwidth.builder().capacity(5).refillGreedy(5, Duration.ofMinutes(1)).build())
            .build();

    private final LettuceBasedProxyManager<byte[]> proxyManager;

    // Fallback in-memory buckets used only when Redis is unreachable
    private final Map<String, io.github.bucket4j.Bucket> fallbackBuckets = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(@Value("${spring.data.redis.url:redis://localhost:6379}") String redisUrl) {
        RedisClient redisClient = RedisClient.create(redisUrl);
        StatefulRedisConnection<byte[], byte[]> connection = redisClient.connect(ByteArrayCodec.INSTANCE);
        this.proxyManager = LettuceBasedProxyManager.builderFor(connection)
                .withExpirationStrategy(
                        ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(Duration.ofMinutes(2)))
                .build();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String method = request.getMethod();
        return !"POST".equalsIgnoreCase(method)
                || (!uri.equals("/api/auth/login") && !uri.equals("/api/auth/register"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain)
            throws ServletException, IOException {

        String ip = resolveClientIp(request);
        String uri = request.getRequestURI();
        boolean isLogin = uri.equals("/api/auth/login");
        BucketConfiguration config = isLogin ? LOGIN_CONFIG : REGISTER_CONFIG;

        // Redis bucket key: "rl:login:<ip>" or "rl:register:<ip>"
        String bucketKey = (isLogin ? "rl:login:" : "rl:register:") + ip;
        byte[] keyBytes = bucketKey.getBytes();

        BucketProbe probe;
        try {
            probe = proxyManager.builder()
                    .build(keyBytes, () -> config)
                    .tryConsumeAndReturnRemaining(1);
        } catch (Exception e) {
            log.warn("Redis unavailable for rate limiting ({}), falling back to in-memory bucket", e.getMessage());
            probe = fallbackBuckets
                    .computeIfAbsent(bucketKey, k -> io.github.bucket4j.Bucket.builder()
                            .addLimit(config.getBandwidths().get(0))
                            .build())
                    .tryConsumeAndReturnRemaining(1);
        }

        if (probe.isConsumed()) {
            response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            chain.doFilter(request, response);
        } else {
            long retryAfterSeconds = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setHeader("X-Rate-Limit-Remaining", "0");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\"," +
                            "\"message\":\"Rate limit exceeded. Retry after " + retryAfterSeconds + " seconds.\"}");
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
