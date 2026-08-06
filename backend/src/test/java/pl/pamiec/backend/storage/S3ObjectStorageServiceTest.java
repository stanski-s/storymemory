package pl.pamiec.backend.storage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class S3ObjectStorageServiceTest {

    private S3Client s3Client;
    private S3ObjectStorageService storageService;

    @BeforeEach
    void setUp() {
        s3Client = mock(S3Client.class);
        storageService = new S3ObjectStorageService(
            s3Client,
            "test-bucket",
            "http://localhost:9000/test-bucket"
        );
    }

    @Test
    void shouldUploadImageAndReturnPublicUrl() {
        UUID cardId = UUID.randomUUID();
        byte[] imageBytes = "fake-png-bytes".getBytes();
        String contentType = "image/png";

        String url = storageService.uploadImage(cardId, imageBytes, contentType);

        ArgumentCaptor<PutObjectRequest> requestCaptor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(requestCaptor.capture(), any(RequestBody.class));

        PutObjectRequest putRequest = requestCaptor.getValue();
        assertThat(putRequest.bucket()).isEqualTo("test-bucket");
        assertThat(putRequest.key()).contains(cardId.toString());
        assertThat(putRequest.contentType()).isEqualTo("image/png");

        assertThat(url).isEqualTo("http://localhost:9000/test-bucket/images/" + cardId + ".png");
    }

    @Test
    void shouldReturnEmptyStringIfImageBytesNullOrEmpty() {
        UUID cardId = UUID.randomUUID();

        String urlNull = storageService.uploadImage(cardId, null, "image/png");
        String urlEmpty = storageService.uploadImage(cardId, new byte[0], "image/png");

        assertThat(urlNull).isEmpty();
        assertThat(urlEmpty).isEmpty();
        verifyNoInteractions(s3Client);
    }
}
