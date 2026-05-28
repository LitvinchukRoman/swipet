package ua.edu.ukma.swipet.backend.common.storage;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

@Slf4j
@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class StorageConfig {

    /**
     * MinIO-клієнт створюється лише якщо backend = "minio".
     * Так у тестах / без MinIO ми не падаємо при старті.
     */
    @Bean
    @ConditionalOnProperty(prefix = "swipet.storage", name = "backend", havingValue = "minio", matchIfMissing = true)
    public MinioClient minioClient(StorageProperties props) {
        StorageProperties.Minio m = props.minio();
        log.info("Configuring MinIO client at {} (bucket={})", m.endpoint(), m.bucket());
        return MinioClient.builder()
                .endpoint(m.endpoint())
                .credentials(m.accessKey(), m.secretKey())
                .build();
    }

    /**
     * Bootstrap бакета при старті (idempotent).
     * Робимо політику публічного READ — медіа має бути доступне за прямим URL.
     */
    @Configuration
    @ConditionalOnProperty(prefix = "swipet.storage", name = "backend", havingValue = "minio", matchIfMissing = true)
    public static class BucketBootstrap {

        @Autowired
        private MinioClient client;

        @Autowired
        private StorageProperties props;

        @EventListener(ApplicationReadyEvent.class)
        public void ensureBucket() {
            StorageProperties.Minio m = props.minio();
            if (!m.autoCreateBucket()) {
                log.info("Skipping MinIO bucket bootstrap (autoCreateBucket=false)");
                return;
            }
            try {
                boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(m.bucket()).build());
                if (!exists) {
                    client.makeBucket(MakeBucketArgs.builder().bucket(m.bucket()).build());
                    log.info("Created MinIO bucket {}", m.bucket());
                }
                client.setBucketPolicy(SetBucketPolicyArgs.builder()
                        .bucket(m.bucket())
                        .config(publicReadPolicy(m.bucket()))
                        .build());
                log.info("Applied public-read policy to bucket {}", m.bucket());
            } catch (Exception ex) {
                log.warn("MinIO bucket bootstrap failed (will be retried lazily on first upload): {}", ex.getMessage());
            }
        }

        private static String publicReadPolicy(String bucket) {
            return """
                    {
                      "Version": "2012-10-17",
                      "Statement": [
                        {
                          "Effect": "Allow",
                          "Principal": "*",
                          "Action": ["s3:GetObject"],
                          "Resource": ["arn:aws:s3:::%s/*"]
                        }
                      ]
                    }
                    """.formatted(bucket);
        }
    }
}
