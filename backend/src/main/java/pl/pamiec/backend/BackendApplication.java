package pl.pamiec.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication(excludeName = "org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration")
public class BackendApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(BackendApplication.class, args);
    }

    private static void loadDotEnv() {
        List<Path> candidatePaths = List.of(
            Paths.get(".env"),
            Paths.get("backend/.env"),
            Paths.get("../.env")
        );

        for (Path path : candidatePaths) {
            if (Files.exists(path)) {
                try {
                    List<String> lines = Files.readAllLines(path);
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = trimmed.indexOf('=');
                        if (eqIdx > 0) {
                            String key = trimmed.substring(0, eqIdx).trim();
                            String value = trimmed.substring(eqIdx + 1).trim();
                            if (!value.isEmpty() && System.getProperty(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    System.out.println("[DotEnvLoader] Loaded env variables from: " + path.toAbsolutePath());
                    break;
                } catch (IOException e) {
                    System.err.println("[DotEnvLoader] Error reading " + path + ": " + e.getMessage());
                }
            }
        }
    }
}
