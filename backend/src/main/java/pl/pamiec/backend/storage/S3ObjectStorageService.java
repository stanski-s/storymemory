package pl.pamiec.backend.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.UUID;

@Service
public class S3ObjectStorageService implements ObjectStorageService {

    private static final Logger log = LoggerFactory.getLogger(S3ObjectStorageService.class);

    private final S3Client s3Client;
    private final String bucketName;
    private final String publicUrlPrefix;

    public S3ObjectStorageService(
            S3Client s3Client,
            @Value("${s3.bucket:pamiec-media}") String bucketName,
            @Value("${s3.public-url-prefix:http://localhost:9000/pamiec-media}") String publicUrlPrefix) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.publicUrlPrefix = publicUrlPrefix.endsWith("/") ? publicUrlPrefix.substring(0, publicUrlPrefix.length() - 1) : publicUrlPrefix;
    }

    @Override
    public String uploadImage(UUID cardId, byte[] imageBytes, String contentType) {
        if (imageBytes == null || imageBytes.length == 0) {
            log.warn("Image bytes null or empty for card ID: {}", cardId);
            return "";
        }

        String extension = contentType != null && contentType.contains("webp") ? ".webp" : ".png";
        String objectKey = "images/" + cardId + extension;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(contentType != null ? contentType : "image/png")
                .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(imageBytes));

            String fullUrl = publicUrlPrefix + "/" + objectKey;
            log.info("Successfully uploaded card image to S3/MinIO: {}", fullUrl);
            return fullUrl;
        } catch (Exception e) {
            log.error("Failed to upload image to S3 for card {}: {}", cardId, e.getMessage(), e);
            return "";
        }
    }
}
