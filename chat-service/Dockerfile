# syntax=docker/dockerfile:1.7

# --- Stage 1: deps ----------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# `npm ci` if a lockfile exists; otherwise fall back to `npm install`.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# --- Stage 2: runtime -------------------------------------------------------
FROM node:22-alpine AS runtime

RUN apk add --no-cache curl tini \
    && addgroup -g 1001 -S node-app \
    && adduser  -u 1001 -S node-app -G node-app

WORKDIR /app
USER node-app:node-app

COPY --from=deps --chown=node-app:node-app /app/node_modules /app/node_modules
COPY --chown=node-app:node-app . .

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 \
    CMD curl -fsS "http://localhost:${PORT}/healthz" || exit 1

# tini for proper signal handling (PID 1 in containers).
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
