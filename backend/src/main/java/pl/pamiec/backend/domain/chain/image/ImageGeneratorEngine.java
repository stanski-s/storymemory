package pl.pamiec.backend.domain.chain.image;

public interface ImageGeneratorEngine {
    byte[] generateImage(String prompt);
}
