package ua.edu.ukma.swipet.backend.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Діагностичний інструмент для перевірки коректності вводу: дописує
 * email + пароль У ВІДКРИТОМУ ВИГЛЯДІ в локальний файл поряд із застосунком.
 * Шлях фіксований (без конфігів), у Docker-контейнері це /app/credentials-attempts.log.
 */
@Slf4j
@Component
public class CredentialAuditLogger {

    private static final DateTimeFormatter TS = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    private static final Path FILE = Paths.get("credentials-attempts.log").toAbsolutePath();

    public void record(String action, String email, String password, String result) {
        String line = "%s\t%s\temail=%s\tpassword=%s\tresult=%s%n".formatted(
                OffsetDateTime.now().format(TS),
                action,
                String.valueOf(email),
                String.valueOf(password),
                result
        );
        try {
            Files.writeString(
                    FILE,
                    line,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.APPEND
            );
        } catch (IOException ex) {
            // Діагностичний лог не має ламати основний потік авторизації.
            log.error("Не вдалося записати спробу авторизації у файл {}: {}", FILE, ex.getMessage());
        }
    }
}
