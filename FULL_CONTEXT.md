# FULL_CONTEXT — Backend status snapshot

> Скоуп цього документа: **тільки бекенд** (Spring Boot + інфра навколо нього).
> Цей файл живе у корені репо як швидка довідка для команди — що готово,
> що під чужим owner-ом, що зламано і потребує уваги.

Власник цього зрізу — **Літвінчук Роман** (Auth + Infra + Storage + CORS).
Інші бекенд-задачі веде **Корявець Денис** (Animal/Shelter/Feed/Donation/
Booking/Analytics).

Дата зрізу: 2026-05-28.

---

## 1. Що готово на бекенді ✅

### 1.1. Інфраструктура / збірка

- `backend/build.gradle` — Spring Boot 4.0.6, Java 25 toolchain, з оновленими
  залежностями:
  - **`spring-boot-starter-flyway`** (Spring Boot 4 більше не auto-конфігурить
    Flyway лише по `flyway-core` — потрібен саме starter, інакше міграції
    мовчки не запускаються).
  - `flyway-database-postgresql` — Flyway 11 для PG 16.
  - `jjwt` 0.12.x (api/impl/jackson) — для access JWT.
  - `io.minio:minio` 8.5.x — для роботи з S3-сумісним сховищем.
  - `spring-boot-starter-actuator` — health-пробби для Docker / nginx.
  - Testcontainers (`junit-jupiter` + `postgresql`).
  - JaCoCo `0.8.13` (`0.8.12` валиться на Java-25 class file `major version 69`).
- `backend/Dockerfile` — multi-stage:
  builder `eclipse-temurin:25-jdk-alpine` → runtime `eclipse-temurin:25-jre-alpine`,
  non-root user `1001:1001`, JVM container-aware
  (`-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`),
  `HEALTHCHECK` на `/actuator/health/readiness`.
- `backend/.dockerignore` виключає `build/`, `.gradle/`, IDE-сміття.
- `backend/src/main/resources/application.yaml` — повний конфіг з ENV-плейсхолдерами:
  datasource, JPA (`ddl-auto: validate`, `open-in-view: false`), Flyway,
  multipart limits, `server.forward-headers-strategy: framework` (для nginx),
  swipet.jwt / swipet.storage / swipet.cors блоки, springdoc, actuator, logging.
- `backend/src/main/resources/application-docker.yaml` — overrides для
  prod-ish docker-режиму (`show-sql: false`).
- `backend/src/test/resources/application-test.yaml` — окремий профіль
  `test` зі `swipet.storage.backend=mock`, тестовим JWT secret.

### 1.2. Auth модуль (`auth/`)

Виконано всі AU-001 .. AU-013.

| Файл | Що це |
| --- | --- |
| `auth/entity/User.java` | `@Entity` із полями розділу 2.1 ТЗ; `role` мапиться через `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` на PG ENUM `user_role`. |
| `auth/entity/Role.java` | `USER`, `SHELTER_ADMIN`, `ADMIN`. |
| `auth/entity/RefreshToken.java` | UUID-токен, `userId`, `expiresAt`, `isRevoked`, `createdAt`; helper `isActive()`. |
| `auth/repository/UserRepository.java` | `findByEmail`, `existsByEmail`. |
| `auth/repository/RefreshTokenRepository.java` | `findByToken`, `deleteByUserId`, `revokeAllByUserId`, `deleteExpiredOrRevoked`. |
| `auth/config/JwtProperties.java` | `@ConfigurationProperties("swipet.jwt")` з валідацією `@Size`/`@Min`. |
| `auth/config/CorsProperties.java` | `@ConfigurationProperties("swipet.cors")`. |
| `auth/config/SecurityConfig.java` | stateless, CSRF off, custom `JwtAuthFilter` перед `UsernamePasswordAuthenticationFilter`, CORS bean, `BCryptPasswordEncoder(12)`, `permitAll` на `/api/v1/auth/{register,login,refresh}`, `/swagger-ui/**`, `/api-docs/**`, `/v3/api-docs/**`, `/actuator/health/**`, OPTIONS-preflight; решта — `authenticated()`. JSON error-handlers для 401/403. |
| `auth/security/JwtAuthFilter.java` | `OncePerRequestFilter`: читає `Authorization: Bearer …`, валідує JWT, кладе `AuthenticatedUser` як principal у `SecurityContext`. |
| `auth/security/AuthenticatedUser.java` | record principal `(id, email, role)` — без додаткового запиту в БД на кожен запит. |
| `auth/security/CurrentUser.java` | `@AuthenticationPrincipal` композиція. |
| `auth/service/JwtService.java` | jjwt 0.12 API; access HS256 з claims `sub/email/role`, `iss/iat/exp`, refresh = UUID (opaque, у БД). |
| `auth/service/AuthService.java` | `register / login / refresh / logout / me`. **Refresh-token rotation**: при `refresh` старий токен помічається revoked, видається нова пара. Login не плодить нескінченну кількість refresh — кожен issue → запис у `refresh_tokens`. Майбутній очисний джоб може ходити по `deleteExpiredOrRevoked`. |
| `auth/dto/{Register,Login,RefreshToken}Request.java` | jakarta-валідація: `@Email`, `@NotBlank`, `@Size(min=8)`, `@Pattern` (літера+цифра). |
| `auth/dto/{Token,Register,User}Response.java` | records, прозорий маппінг. |
| `auth/controller/AuthController.java` | `POST /register/login/refresh/logout`, `GET /me/verify`. Swagger-аннотації. |

### 1.3. Common (`common/`)

- `common/exception/AppException.java` — типізована runtime-помилка з `HttpStatus`, `code`, factory-методами `notFound/conflict/unauthorized/forbidden/badRequest`.
- `common/exception/ErrorResponse.java` — фінальний JSON-конверт + `FieldViolation`.
- `common/exception/GlobalExceptionHandler.java` — `@RestControllerAdvice`:
  `AppException`, `MethodArgumentNotValidException`, `ConstraintViolationException`,
  `AuthenticationException`/`BadCredentialsException`, `AccessDeniedException`,
  fallback `Exception`. Структура помилки збігається з 3.0 у `docs/api/CONTRACT.md`.
- `common/config/OpenApiConfig.java` — `OpenAPI` bean із Bearer security
  scheme `bearer-jwt`, прив'язаним глобально (Swagger показує "Authorize" кнопку).

### 1.4. Storage (GEN-003)

- `common/storage/StorageService.java` — інтерфейс (вже існував).
- `common/storage/StorageProperties.java` — `@ConfigurationProperties("swipet.storage")` із nested `Minio`.
- `common/storage/StorageConfig.java` — `MinioClient` bean, **bucket bootstrap** (idempotent: створює бакет якщо його немає, ставить публічну read-only policy для медіа). Активується тільки коли `swipet.storage.backend=minio` (default).
- `common/storage/MinioStorageService.java` — `@Primary` `@ConditionalOnProperty`,
  - валідація MIME (`image/jpeg|png|webp|gif`),
  - ліміт **5 MiB** (відповідно до п. 10 безпеки ТЗ),
  - ключ об'єкту: `yyyy/MM/dd/<uuid>.<ext>` — клієнтське ім'я не довіряється,
  - публічний URL формується через `MINIO_PUBLIC_URL` (CDN-friendly),
  - `deleteFile` парсить URL → object key через `URI.path` (не string-mangling).
- `common/storage/MockStorageService.java` оновлено — тепер `@ConditionalOnProperty(backend=mock)`, працює лише у тест-профілі.

### 1.5. CORS (GEN-004)

- Реалізовано через `UrlBasedCorsConfigurationSource` у `SecurityConfig`,
  читається з `swipet.cors.*`, comma-separated `FRONTEND_URL`.
- `setAllowedOriginPatterns` (а не `Origins`) — щоб працювало з
  `allowCredentials=true` для Expo dev-серверів на динамічних портах.

### 1.6. Тести

20 тестів green:

- `JwtServiceTest` — generate→validate→extract round-trip; ламаний токен;
  різний secret; рандомні refresh UUID.
- `AuthServiceTest` — register (новий + дублікат), login (правильний/
  невірний пароль/невідомий email), refresh (валідний → ротація;
  expired → 401), logout (помічає revoked).
- `AuthControllerTest` (Testcontainers Postgres + Flyway):
  - `register → 201` з токенами
  - `login → 200`
  - `me` без токена → `401`
  - `me` з токеном → `200`
  - дублікат email → `409`
  - слабкий пароль → `400` з `violations`
  - rotation: повторне `refresh` зі старим токеном → `401`
- `AbstractIntegrationTest` — спільна база на Testcontainers Postgres 16,
  з reuse-стратегією.

```bash
cd backend && ./gradlew test
# BUILD SUCCESSFUL — 20 tests, 0 failed
```

### 1.7. Інфраструктура / docker-compose

- `docker-compose.yml` (у корені) — postgres + minio + backend + chat-service + nginx.
  - `service_healthy` для всіх залежностей (postgres, minio, backend),
    тому backend стартує тільки коли БД відповіла на `pg_isready`.
  - MinIO healthcheck `http://localhost:9000/minio/health/live`.
  - Backend healthcheck — Actuator `/actuator/health/readiness`.
  - Усі ENV проброшено з `.env` (через `${VAR:-default}`).
- `infra/postgres/init.sql` — створює read-only роль `swipet_readonly`
  для майбутньої аналітики; вмикає `uuid-ossp`, `pgcrypto`. Виконується
  тільки на порожньому volume (стандартний `docker-entrypoint-initdb.d/`).
- `infra/nginx/nginx.conf` + `infra/nginx/conf.d/swipet.conf`:
  - reverse proxy `/api/* → backend:8080`, `/socket.io/* → chat-service:3001`,
  - **rate-limit 30 req/s** на `/api/v1/auth/**` (зона `auth_zone`),
    100 req/s загальне на `/api/`,
  - HTTPS 443 з self-signed (інструкція як згенерувати — `infra/nginx/certs/README.md`),
  - HTTP 80 → 301 на HTTPS, окрім `/healthz`,
  - security headers: `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`,
    `Referrer-Policy strict-origin-when-cross-origin`,
    `Strict-Transport-Security max-age=31536000; includeSubDomains`,
    `Content-Security-Policy default-src 'self'; ...; frame-ancestors 'none'`,
    `Permissions-Policy geolocation=(self), microphone=(), camera=()`.
  - WebSocket upgrade hops + `proxy_read_timeout 3600s` для довгих сесій.

### 1.8. chat-service placeholder

Каталог `chat-service/` створено мінімально, щоб `docker compose up` не
падав до того, як Цьопич змержить реальну імплементацію:

- `chat-service/Dockerfile` — multi-stage Node 22-alpine, non-root,
  `tini` як PID 1, `HEALTHCHECK` на `/healthz`.
- `chat-service/src/index.js` — placeholder, що відповідає 200 на `/healthz`,
  все інше → 501 з `NOT_IMPLEMENTED`. Чітко написано хто власник + контракт
  (порти, шляхи, ENV).
- `chat-service/package.json` — заявлені деп-залежності (express, socket.io,
  jsonwebtoken, pino) як future-прохід для `npm ci`.

### 1.9. Документація

- `README.md` — Prerequisites, Quick Start (`cp .env.example .env` →
  openssl cert → `docker compose up --build`), ENV огляд, Project Structure,
  API Docs URL, Testing.
- `CONTRIBUTING.md` — git flow (`feature/<TASK-ID>-...`, `bugfix/`,
  `hotfix/`), conventional commits з task id, PR rules (≤400 рядків,
  ≥1 review, всі тести green), де запускати тести, code style, secrets,
  Definition of Done.
- `docs/api/CONTRACT.md` — повний REST + WebSocket контракт, з позначкою
  `✅` (готово) / `🚧` (заплановано). Auth — детально розписаний,
  всі інші ендпоінти ТЗ — як stub-контракт.
- `.env.example` — згруповано по доменах (Postgres / JWT / MinIO / nginx /
  backend / chat-service / Expo) з коментарями і прикладом
  `openssl rand -base64 48` для `JWT_SECRET`.

### 1.10. Міграції

- Усі V1..V8 вже існували (Корявець). Я додав V9 для refresh-токенів.
- `V9__create_refresh_tokens.sql` — таблиця `refresh_tokens`
  з FK на `users(id) ON DELETE CASCADE` + 2 індекси.

---

## 2. Що зроблено погано / варто покращити (на майбутнє) ⚠️

> Це не блокери — пишу sticky-list, щоб команда бачила відомі недоліки.

### 2.1. У вже мерженого коду (Корявця) — рекомендую виправити

1. **`shelter/entity/Shelter.java` — це stub з єдиним полем `id`**.
   Через це `AnimalRepository.findFeedAnimals` працює лише тому, що
   запит native, а Hibernate validate на shelters тільки перевіряє
   таблицю + колонку `id`. Як тільки Корявець почне використовувати
   `Shelter.location_lat/lng` через JPA, доведеться розписати entity.
   На цьому моменті теж варто додати `@JdbcTypeCode(SqlTypes.NAMED_ENUM)`
   де є custom PG ENUM.
2. **Animal entity vs PG ENUMs** — `Animal.java` використовує
   `@Enumerated(EnumType.STRING)` без `@JdbcTypeCode(SqlTypes.NAMED_ENUM)`,
   а DB-колонки — кастомні PG ENUM-и (`animal_species`, `animal_size`,
   `animal_gender`, `animal_status`). На рівні INSERT з JPA це впаде з
   `column "species" is of type animal_species but expression is of type
   character varying`. Я застосував коректний патерн у `User.role`
   (NAMED_ENUM + `columnDefinition="user_role"`) — рекомендую перенести
   на Animal/Booking/Donation entities.
3. **`AnimalService` кидає `RuntimeException("...")`** замість
   `AppException.notFound(...)` / `.badRequest(...)`. Через це
   `GlobalExceptionHandler` ловить його як generic 500, і фронт
   побачить шум. Варто відрефакторити, тепер `AppException` доступний.
4. **`AnimalRepository.findFeedAnimals` має `JOIN shelters` на
   `s.location_lat/lng`** — але міграція V2 створює `shelters` без
   індексу на координати. На MVP це норм, в `analytics` фазі додати
   GIST/функціональний індекс (Haversine не SARGable).
5. **`MockStorageService.uploadFile` повертав порожній рядок `""`**.
   Це створювало "порожні" `AnimalPhoto.url` рядки. Перероблено на
   `mock://media/<uuid>/<filename>`, що дає можливість дебажити, які
   файли підготовлено у тестовому потоці.
6. **`AnimalPhoto` має `@ManyToOne(fetch=LAZY)` на `Animal`** — у
   `PhotoService.deletePhoto` йде `photo.getAnimal().getId()`, що
   тригерить N+1. Не критично (один запит), але якщо буде батч-видалення
   — переписати на JPQL `delete from AnimalPhoto p where p.id in (...)`.

### 2.2. Власні корнер-кейси (мої) — на доопрацювання у наступному PR

1. **CI** не налаштовано. У ТЗ є приклад `.github/workflows/ci.yml`,
   але на момент цього зрізу його у репо немає. Запланувати: PR
   `feature/INF-CI-github-actions` (build + test для backend; jest для
   chat-service коли з'явиться). Залишив TODO у README.
2. **JaCoCo coverage gate** оголошено на 60%, але не прив'язано до
   `check` — `./gradlew check` не падатиме на coverage. Свідомо: щоб
   не блокувати поточних розробників. Активувати після CI.
3. **`AuthController.verify`** — повертає `200` + `{valid:true,...}`,
   але це викликаючий сервіс (chat-service на Node) має ходити саме на
   цей ендпоінт. Альтернатива — chat-service сам валідує JWT за тим
   самим `JWT_SECRET`. Я залишив обидва шляхи відкритими; вибір — за
   Цьопичем.
4. **Refresh-token cleanup**: `RefreshTokenRepository.deleteExpiredOrRevoked`
   написаний, але `@Scheduled` поки не виставлений. План — окремий
   `feature/AU-014-refresh-cleanup-job`.
5. **`SecurityConfig` дозволяє** `permitAll` для самого `/api/v1/auth/refresh`,
   але refresh — це state-changing операція. Захист: токен у тілі
   запиту, не у cookies; refresh обов'язково ротується. Якщо команда
   захоче — можна додати rate-limit на refresh окремо в nginx.

---

## 3. Що НЕ моя відповідальність (відмежовано) 🚧

Залишив поза скоупом, очікую від Корявця / Цьопича:

- **Animal/Shelter/Feed/Swipe/Donation/Booking/Analytics** — Корявець.
  Все, що в `animal/`, `shelter/`, `swipe/`, `donation/`, `booking/`,
  `analytics/` крім ENUM-фіксів які описав вище.
- **chat-service** реальна реалізація (Socket.io handlers, room manager,
  middleware, тести) — Цьопич. Я лишив контракт у `docs/api/CONTRACT.md`.
- **GlobalExceptionHandler** — мерджабельний як є. Корявцю достатньо
  кидати `AppException.*` і не дублювати `@ExceptionHandler`-и.
- **Swagger/OpenAPI grouping по модулях** (GEN-002) — базовий
  `OpenApiConfig` з security scheme поставлений; групування лишаю
  Корявцю при додаванні `AnimalController/ShelterController/...`
  (SpringDoc підхопить тегування з `@Tag` на контролерах).
- **MapStruct** — у поточних DTO-маппінгах не використовується. Можна
  вкрутити пізніше, якщо буде багато бойлерплейту.
- **Frontend** — Вус Павло.

---

## 4. Як повторити локально

```bash
# 1) перевірити, що бекенд тестується сам по собі
cd backend && ./gradlew test            # потребує запущеного Docker (Testcontainers)

# 2) перевірити, що повний стек піднімається
cd ..
cp .env.example .env
mkdir -p infra/nginx/certs && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout infra/nginx/certs/swipet.key \
    -out    infra/nginx/certs/swipet.crt \
    -subj   "/CN=localhost/O=Swipet/C=UA"
docker compose up --build

# smoke
curl -fsS https://localhost/healthz -k
curl -fsS https://localhost/api/v1/auth/register -k \
  -H 'content-type: application/json' \
  -d '{"email":"smoke@swipet.io","password":"Password1!","fullName":"Smoke"}'
```

---

## 5. Файли, додані / змінені у цьому зрізі

```
.env.example                                                      [new]
.gitignore                                                        [new]
README.md                                                         [new]
CONTRIBUTING.md                                                   [new]
FULL_CONTEXT.md                                                   [new]   <-- ви тут
docs/api/CONTRACT.md                                              [new]

docker-compose.yml                                                [new]
infra/postgres/init.sql                                           [new]
infra/nginx/nginx.conf                                            [new]
infra/nginx/conf.d/swipet.conf                                    [new]
infra/nginx/certs/{README.md,.gitignore}                          [new]

chat-service/{package.json, src/index.js, Dockerfile,
              .dockerignore, README.md}                           [new placeholders]

backend/build.gradle                                              [edit] +Flyway starter, +jjwt, +minio, +TC, +JaCoCo
backend/Dockerfile                                                [new]
backend/.dockerignore                                             [new]
backend/src/main/resources/application.yaml                       [edit] full config
backend/src/main/resources/application-docker.yaml                [new]
backend/src/main/resources/db/migration/V9__create_refresh_tokens.sql [new]

backend/src/main/java/.../auth/...                                [new] full module
backend/src/main/java/.../common/exception/...                    [new]
backend/src/main/java/.../common/config/OpenApiConfig.java        [new]
backend/src/main/java/.../common/storage/StorageProperties.java   [new]
backend/src/main/java/.../common/storage/StorageConfig.java       [new]
backend/src/main/java/.../common/storage/MinioStorageService.java [new]
backend/src/main/java/.../common/storage/MockStorageService.java  [edit] cond + non-empty url

backend/src/test/java/.../AbstractIntegrationTest.java            [new]
backend/src/test/java/.../BackendApplicationTests.java            [edit] inherit base
backend/src/test/java/.../auth/service/JwtServiceTest.java        [new]
backend/src/test/java/.../auth/service/AuthServiceTest.java       [new]
backend/src/test/java/.../auth/controller/AuthControllerTest.java [new]
backend/src/test/resources/application-test.yaml                  [new]
```
