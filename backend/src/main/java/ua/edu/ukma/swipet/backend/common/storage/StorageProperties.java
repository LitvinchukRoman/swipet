package ua.edu.ukma.swipet.backend.common.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;

@ConfigurationProperties(prefix = "swipet.storage")
public record StorageProperties(
        String backend,
        @NestedConfigurationProperty Minio minio
) {
    public record Minio(
            String endpoint,
            String accessKey,
            String secretKey,
            String bucket,
            String publicUrl,
            boolean autoCreateBucket
    ) { }
}
