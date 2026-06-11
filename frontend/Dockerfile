# --- Stage 1: Build Expo web static export ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Expo inlines EXPO_PUBLIC_* at *build* time, so they must be present here
# (a runtime `environment:` in compose has no effect on a static export).
ARG EXPO_PUBLIC_API_URL=https://localhost/api/v1
ARG EXPO_PUBLIC_SOCKET_URL=https://localhost
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_SOCKET_URL=$EXPO_PUBLIC_SOCKET_URL

# Build static web export
RUN npx expo export

# --- Stage 2: Serve with nginx (or just copy files for nginx to serve) ---
FROM node:22-alpine AS runtime

RUN apk add --no-cache curl
WORKDIR /app

COPY --from=builder /app/dist ./dist

# Simple HTTP server for development/testing
# In production, nginx will serve these files directly
EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8081 || exit 1

CMD ["npx", "serve", "-s", "dist", "-l", "8081"]
