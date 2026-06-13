package ua.edu.ukma.swipet.backend.common.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String uploadFile(MultipartFile file);
    void deleteFile(String fileUrl);

    /**
     * Чи належить URL нашому сховищу (тобто був згенерований {@link #uploadFile}).
     * Використовується, щоб не дозволяти клієнту встановлювати довільний зовнішній
     * avatar/logo URL (hotlink / impersonation) через PATCH-профіль.
     */
    boolean isOwnedUrl(String url);
}