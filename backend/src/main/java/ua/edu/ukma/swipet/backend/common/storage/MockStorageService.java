package ua.edu.ukma.swipet.backend.common.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * In-memory заглушка для тестів і локального dev-режиму без MinIO.
 * Активується через {@code swipet.storage.backend=mock} (див. {@code application-test.yaml}).
 */
@Slf4j
@Service
@ConditionalOnProperty(prefix = "swipet.storage", name = "backend", havingValue = "mock")
public class MockStorageService implements StorageService {

    @Override
    public String uploadFile(MultipartFile file) {
        String name = file == null || file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String fakeUrl = "mock://media/" + UUID.randomUUID() + "/" + name;
        log.debug("[mock] uploadFile -> {}", fakeUrl);
        return fakeUrl;
    }

    @Override
    public void deleteFile(String fileUrl) {
        log.debug("[mock] deleteFile {}", fileUrl);
    }

    @Override
    public boolean isOwnedUrl(String url) {
        return url != null && url.startsWith("mock://media/");
    }
}
