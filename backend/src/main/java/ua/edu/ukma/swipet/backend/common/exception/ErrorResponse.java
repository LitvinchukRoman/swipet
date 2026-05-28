package ua.edu.ukma.swipet.backend.common.exception;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
        String error,
        String message,
        int statusCode,
        Instant timestamp,
        String path,
        List<FieldViolation> violations
) {
    public static ErrorResponse of(String error, String message, int statusCode, String path) {
        return new ErrorResponse(error, message, statusCode, Instant.now(), path, List.of());
    }

    public static ErrorResponse of(String error, String message, int statusCode, String path, List<FieldViolation> violations) {
        return new ErrorResponse(error, message, statusCode, Instant.now(), path, violations);
    }

    public record FieldViolation(String field, String message) { }
}
