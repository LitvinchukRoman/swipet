package ua.edu.ukma.swipet.backend.common.storage;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MockStorageService implements StorageService {

    @Override
    public String uploadFile(MultipartFile file) {
        return "";
    }

    @Override
    public void deleteFile(String fileUrl) {

    }
}
