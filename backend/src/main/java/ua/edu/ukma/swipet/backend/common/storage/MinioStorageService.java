package ua.edu.ukma.swipet.backend.common.storage;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.errors.ErrorResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ua.edu.ukma.swipet.backend.common.exception.AppException;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * S3-сумісне сховище (MinIO або AWS S3 — залежить від {@code MINIO_ENDPOINT}).
 *
 * <p>Контракт:
 * <ul>
 *   <li>Файл зберігається з ключем {@code yyyy/MM/dd/<uuid>.<ext>}.</li>
 *   <li>Бакет робиться публічним на читання (див. {@link StorageConfig.BucketBootstrap}),
 *       тому повертається прямий public URL.</li>
 *   <li>{@code deleteFile} приймає той самий URL, який повернув {@code uploadFile},
 *       і видаляє відповідний об'єкт; невідомий URL → no-op.</li>
 * </ul>
 *
 * <p>Безпека: ми перевіряємо MIME-type на whitelist (image/*, відео не приймаємо)
 * і не довіряємо клієнтському імені файлу при формуванні ключа.
 */
@Slf4j
@Service
@Primary
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "swipet.storage", name = "backend", havingValue = "minio", matchIfMissing = true)
public class MinioStorageService implements StorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final long MAX_BYTES = 5L * 1024L * 1024L; // 5 MiB
    private static final DateTimeFormatter DATE_PREFIX = DateTimeFormatter.ofPattern("yyyy/MM/dd", Locale.ROOT);

    private final MinioClient client;
    private final StorageProperties props;

    @Override
    public String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw AppException.badRequest("File is empty");
        }
        if (file.getSize() > MAX_BYTES) {
            throw AppException.badRequest("File too large (max 5 MiB)");
        }

        String contentType = file.getContentType() != null
                ? file.getContentType().toLowerCase(Locale.ROOT)
                : "application/octet-stream";
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw AppException.badRequest("Unsupported content-type: " + contentType);
        }

        String key = buildKey(file.getOriginalFilename(), contentType);
        StorageProperties.Minio m = props.minio();

        try (InputStream is = file.getInputStream()) {
            client.putObject(PutObjectArgs.builder()
                    .bucket(m.bucket())
                    .object(key)
                    .stream(is, file.getSize(), -1)
                    .contentType(contentType)
                    .build());
            log.info("Uploaded {} to bucket {} ({} bytes, {})", key, m.bucket(), file.getSize(), contentType);
        } catch (IOException ex) {
            throw new AppException(org.springframework.http.HttpStatus.BAD_REQUEST,
                    "UPLOAD_FAILED", "Failed to read uploaded file: " + ex.getMessage());
        } catch (Exception ex) {
            log.error("MinIO upload failed for key {}: {}", key, ex.getMessage(), ex);
            throw new AppException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "STORAGE_UNAVAILABLE", "Upload failed: " + ex.getMessage());
        }

        return publicUrlFor(key);
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }
        String key = extractKey(fileUrl);
        if (key == null) {
            log.warn("Cannot extract object key from URL '{}', skipping delete", fileUrl);
            return;
        }

        StorageProperties.Minio m = props.minio();
        try {
            client.removeObject(RemoveObjectArgs.builder()
                    .bucket(m.bucket())
                    .object(key)
                    .build());
            log.info("Deleted {} from bucket {}", key, m.bucket());
        } catch (ErrorResponseException ex) {
            log.warn("MinIO returned error on delete of {}: {}", key, ex.errorResponse().code());
        } catch (Exception ex) {
            log.error("Failed to delete {} from bucket {}: {}", key, m.bucket(), ex.getMessage(), ex);
        }
    }

    private String buildKey(String originalName, String contentType) {
        String ext = guessExtension(originalName, contentType);
        return DATE_PREFIX.format(LocalDate.now()) + "/" + UUID.randomUUID() + ext;
    }

    private static String guessExtension(String originalName, String contentType) {
        if (originalName != null) {
            int dot = originalName.lastIndexOf('.');
            if (dot >= 0 && dot < originalName.length() - 1) {
                String ext = originalName.substring(dot).toLowerCase(Locale.ROOT);
                if (ext.matches("\\.(jpe?g|png|webp|gif)")) return ext;
            }
        }
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> "";
        };
    }

    @Override
    public boolean isOwnedUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        // Належить сховищу, якщо містить шлях до нашого бакета (працює і для public-url, і для endpoint).
        return extractKey(url) != null;
    }

    private String publicUrlFor(String key) {
        StorageProperties.Minio m = props.minio();
        String base = (m.publicUrl() == null || m.publicUrl().isBlank())
                ? m.endpoint()
                : m.publicUrl();
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        return base + "/" + m.bucket() + "/" + key;
    }

    /**
     * Витягуємо object key з public URL: усе після bucket name у path.
     * Працює як з {@code https://cdn.swipet.app/bucket/2025/01/02/uuid.jpg},
     * так і з {@code http://minio:9000/bucket/2025/01/02/uuid.jpg}.
     */
    private String extractKey(String fileUrl) {
        try {
            URI uri = new URI(fileUrl);
            String path = uri.getPath();
            if (path == null) return null;
            String bucket = "/" + props.minio().bucket() + "/";
            int idx = path.indexOf(bucket);
            if (idx < 0) return null;
            return path.substring(idx + bucket.length());
        } catch (URISyntaxException ex) {
            return null;
        }
    }
}
