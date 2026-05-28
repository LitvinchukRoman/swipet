# Swipet

Mobile platform for animal adoption (Tinder-style swipes for shelter animals).
Modular monolith on Spring Boot + Node.js realtime chat + React Native client,
all packaged with `docker-compose`.

> Owners (FYI):
> - **Core Backend** — Корявець Денис
> - **Auth + Infra + Storage + CORS** — Літвінчук Роман
> - **Chat Service** — Цьопич Андрій
> - **Mobile / Web Client** — Вус Павло

For a deeper view of *what is currently merged on backend*, see
[`FULL_CONTEXT.md`](FULL_CONTEXT.md). For the REST/WebSocket API contract
(no implementation yet), see [`docs/api/CONTRACT.md`](docs/api/CONTRACT.md).

---

## 1. Prerequisites

| Tool | Version | Why |
| --- | --- | --- |
| Docker Desktop | 24+ | docker-compose v2 |
| Node.js | 22+ | local React Native / chat-service dev |
| JDK | 25 (Temurin) | Spring Boot 4.0 toolchain |
| openssl | any | self-signed TLS certs for `nginx` (dev only) |

You don't strictly need Java/Node locally — `docker compose up --build`
builds everything inside containers. They're only required if you want to
run individual services with hot reload outside Docker.

---

## 2. Quick start

```bash
git clone git@github.com:swipet/swipet.git
cd swipet

# 1. fill secrets locally — file is git-ignored.
cp .env.example .env
$EDITOR .env

# 2. one-shot self-signed cert for the nginx HTTPS listener.
mkdir -p infra/nginx/certs
openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout infra/nginx/certs/swipet.key \
  -out    infra/nginx/certs/swipet.crt \
  -subj   "/CN=localhost/O=Swipet/C=UA" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# 3. up.
docker compose up --build
```

After ~60 s you should see `swipet-backend  | Started BackendApplication`.
Smoke-test:

```bash
curl -k https://localhost/healthz                          # nginx
curl    http://localhost:8080/actuator/health              # backend
curl    http://localhost:9001                              # MinIO console
```

Tear down (and wipe volumes if you want a clean DB):

```bash
docker compose down            # keep data
docker compose down -v         # also drop postgres_data + minio_data
```

---

## 3. Environment variables

The full list with comments lives in [`.env.example`](.env.example).
High-level groups:

| Group | Variables | Notes |
| --- | --- | --- |
| **Postgres** | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` | bootstrapped by `infra/postgres/init.sql` |
| **JWT** | `JWT_SECRET`, `JWT_ACCESS_EXPIRATION`, `JWT_REFRESH_EXPIRATION`, `JWT_ISSUER` | secret must be ≥ 256 bit |
| **MinIO** | `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET`, `MINIO_PUBLIC_URL` | bucket is auto-created on first start |
| **Reverse proxy** | `HTTP_PORT`, `HTTPS_PORT` | nginx host bindings |
| **Backend** | `BACKEND_PORT`, `FRONTEND_URL` | `FRONTEND_URL` is comma-separated list for CORS |
| **Chat service** | `CHAT_PORT` | placeholder owned by `@andrii-tsiopych` |
| **Expo** | `EXPO_PUBLIC_*` | read by the mobile app only |

> **Never** put real secrets into `.env.example`. Generate `JWT_SECRET` with
> `openssl rand -base64 48`.

---

## 4. Project structure

```
swipet/
├── backend/                 # Spring Boot 4 modular monolith (Java 25)
│   ├── src/main/java/.../
│   │   ├── auth/            # Auth module (this PR)
│   │   ├── animal/          # Денис
│   │   ├── shelter/         # Денис
│   │   └── common/          # storage, exception handler, OpenAPI config
│   ├── src/main/resources/db/migration/   # Flyway V1..V9
│   ├── build.gradle
│   └── Dockerfile           # multi-stage (builder → JRE 25 alpine)
├── chat-service/            # Node.js + Socket.io (placeholder, Андрій)
│   └── Dockerfile
├── frontend/                # React Native + Expo (Павло)
├── infra/
│   ├── postgres/init.sql
│   └── nginx/
│       ├── nginx.conf
│       ├── conf.d/swipet.conf       # rate-limit, security headers, TLS
│       └── certs/                   # self-signed (gitignored)
├── docs/api/CONTRACT.md     # REST + WebSocket API contract (auth slice live)
├── docker-compose.yml       # postgres + minio + backend + chat + nginx
├── .env.example
└── FULL_CONTEXT.md          # what's done on backend right now
```

---

## 5. API docs

| URL (after `docker compose up`) | Что |
| --- | --- |
| `https://localhost/swagger-ui/` | Swagger UI (live, generated from controllers) |
| `https://localhost/v3/api-docs` | Raw OpenAPI JSON |
| `docs/api/CONTRACT.md` | Hand-written contract doc (full surface, even unimplemented) |

Auth endpoints already implemented and visible in Swagger:
`POST /api/v1/auth/{register,login,refresh,logout}`,
`GET /api/v1/auth/{me,verify}`.

---

## 6. Testing

```bash
cd backend
./gradlew test           # all unit + integration (Testcontainers spins up Postgres)
./gradlew jacocoTestReport
open build/reports/jacoco/test/html/index.html
```

Coverage today: see `JaCoCo` HTML report; floor configured at 60%
(`jacocoTestCoverageVerification`). CI will be wired by Літвінчук in
a follow-up — see `.github/workflows/` (TODO).

Tests touched in this PR:

- `JwtServiceTest` — sign / verify / extract round-trip + tampered tokens
- `AuthServiceTest` — register/login/refresh/logout happy + sad paths (Mockito)
- `AuthControllerTest` — 201/200/401/409/400 + refresh-token rotation
  (Spring `@SpringBootTest` + Testcontainers Postgres + Flyway)

---

## 7. Make / common workflows

```bash
# rebuild only the backend image (faster iteration)
docker compose up --build backend

# tail logs from all services
docker compose logs -f --tail=100

# psql into the dockerized DB
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB

# regenerate self-signed cert (e.g. expired)
rm infra/nginx/certs/swipet.{crt,key} && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout infra/nginx/certs/swipet.key -out infra/nginx/certs/swipet.crt \
    -subj "/CN=localhost"
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for git flow, PR rules, and where to
run tests inside the monorepo.
