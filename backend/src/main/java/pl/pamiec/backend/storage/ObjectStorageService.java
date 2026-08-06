package pl.pamiec.backend.storage;

import java.util.UUID;

public interface ObjectStorageService {
    String uploadImage(UUID cardId, byte[] imageBytes, String contentType);
}
