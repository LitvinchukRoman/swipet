# --- Stage 1: build ---------------------------------------------------------
# Pinned digest-friendly tag; Java 25 to match build.gradle toolchain.
FROM eclipse-temurin:25-jdk-alpine AS builder

WORKDIR /workspace

# Copy gradle wrapper and metadata first for better layer caching.
COPY gradlew gradlew
COPY gradle gradle
COPY settings.gradle build.gradle ./

RUN chmod +x gradlew \
    && ./gradlew --no-daemon --version \
    && ./gradlew --no-daemon dependencies > /dev/null || true

COPY src src

# Skip tests in image build — CI is responsible for them.
RUN ./gradlew --no-daemon clean bootJar -x test \
    && ls -la build/libs/

# --- Stage 2: runtime -------------------------------------------------------
FROM eclipse-temurin:25-jre-alpine AS runtime

# Non-root, fixed UID/GID for k8s readiness probes / volume permissions.
RUN addgroup -g 1001 -S spring \
    && adduser  -u 1001 -S spring -G spring -h /home/spring

# curl for HEALTHCHECK; tzdata for sane timestamps in logs.
RUN apk add --no-cache curl tzdata \
    && mkdir -p /app \
    && chown spring:spring /app

WORKDIR /app
USER spring:spring

COPY --from=builder --chown=spring:spring /workspace/build/libs/*.jar /app/app.jar

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError" \
    SERVER_PORT=8080 \
    SPRING_PROFILES_ACTIVE=docker

EXPOSE 8080

# Spring Boot Actuator health endpoint (exposed in application.yaml).
HEALTHCHECK --interval=15s --timeout=3s --start-period=45s --retries=5 \
    CMD curl -fsS "http://localhost:${SERVER_PORT}/actuator/health/readiness" || exit 1

# Use exec form so signals propagate (graceful shutdown).
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
