# Swipet — журнал змін (production-readiness)

Зведення робіт із підготовки застосунку до проду: виправлення логічних багів
фронтенду, безпеки/грошового флоу/надійності бекенду та інфраструктури.

---

## Backend — безпека (IDOR / impersonation)

- **Чат: читання історії чужої кімнати.** `ChatService.getRoomHistory` тепер перевіряє
  membership — доступ лише в автора кімнати, адміна відповідного притулку або
  платформенного `ADMIN`. (`chat/service/ChatService.java`, `chat/controller/ChatController.java`)
- **Чат: підробка відправника.** Внутрішній ендпоінт `POST /internal/rooms/{id}/messages`
  бере відправника **виключно з JWT** (`@CurrentUser`); `senderId` із тіла ігнорується.
- **Власність притулку.** Новий `common/security/ShelterOwnershipGuard`: `SHELTER_ADMIN`
  може керувати лише тваринами/слотами/фото/лого **свого** притулку; `ADMIN` — усім.
  Підключено в `AnimalController`, `ShelterController`, `BookingController`.
- **avatarUrl.** У `PATCH /users/me` приймається лише URL із нашого сховища
  (`StorageService.isOwnedUrl`); сторонні URL тихо ігноруються (anti-hotlink/impersonation).

## Backend — грошовий флоу (Stripe)

- **Опікунство ACTIVE до оплати.** `VirtualGuardianship` створюється `isActive=false`
  + `activation_tx_id` (id Stripe-сесії). Активується лише після підтвердження саме
  цього платежу — спільний `DonationService.applySuccessfulPayment(...)`, який
  викликається і вебхуком, і `/verify-session`.
- **Вебхук без перевірки оплати.** Тепер перевіряється `session.payment_status`
  (`paid` / `no_payment_required`) перед зарахуванням.
- **Тихе ковтання payload.** При нечитабельній/null Stripe-сесії кидаємо `500`, щоб
  Stripe повторив доставку (раніше донат назавжди лишався `PENDING`).
- **Рекурентний cron.** Більше не посуває `next_billing_at` без оплати; не плодить
  дублікати (skip, якщо вже є `PENDING`-підписка для пари user+animal); серіалізація
  між інстансами через Postgres advisory-lock (`pg_try_advisory_xact_lock`).

## Backend — надійність

- **Дублікати опікунств.** Частковий unique-індекс `uq_active_guardianship_per_user_animal`
  на `(user_id, animal_id) WHERE is_active` (міграція `V13`) + перевірка при створенні.
- **Овербукінг слотів.** `BookingService.bookSlot` бере слот під pessimistic write-lock
  (`BookingSlotRepository.findByIdForUpdate` → `SELECT … FOR UPDATE`).
- **Гонка refresh-токена.** Атомарний conditional-update `RefreshTokenRepository.revokeIfActive`
  (0 рядків → відмова `already used`), щоб один токен не видавав кілька валідних пар.

## Backend — попередні задачі (раніше в сесії)

- `shelterId` проведено з SQL → `FeedAnimalResponse` (картки стрічки більше не мають
  хардкоду `shelterId:0`).
- `GuardianshipDTO` отримав `animalSpecies` / `animalBreed`.
- Реалізовано `GET /donations/verify-session` (+ `VerifySessionResponse`,
  `PaymentVerificationStatus`).
- `ChatRoomResponse` отримав `animalSpecies` (для emoji у списку чатів).

## Frontend — виправлені баги

- `services/feed.ts` — реальний `shelterId` замість `0` → працюють Message/Donate/Foster/Visit.
- `chat/ChatRoomView.tsx` — прибрано `disconnectSocket()` із cleanup кімнати (рвав
  глобальний сокет); історія мерджиться з optimistic-pending; `clientMessageId` для
  коректного матчингу; offline-захист відправки.
- `common/DonationSheet.tsx` — скасовуваний таймер відкриття браузера; коректні
  success-повідомлення; мінімум ₴10 (разовий) / ₴50 (опікунство).
- `SwipeDeck.tsx` — `isAnimating` guard проти подвійного свайпу.
- `payment-success.tsx` — редирект без `session_id`, polling-верифікація (перейменовано
  з `payment-sucess.tsx`).
- `store/auth.ts` + `services/api.ts` — epoch для refresh, щоб race refresh↔logout/login
  не відновлював стару сесію; user оновлюється з токена.
- `_layout.tsx` + `lib/jwt.ts` / `lib/roles.ts` — роль для гарда береться з JWT, якщо
  немає в кешованому user.
- `(tabs)/liked.tsx`, `animal/[id].tsx` — `try/catch` + перевірка `shelterId` у openChat.
- `shelter/[id].tsx` — реалізовано «Contact Shelter».
- `lib/filters.ts` — єдина логіка лічильника активних фільтрів (`index.tsx`, `FilterBottomSheet.tsx`).
- `store/feed.ts` — `feedEpoch` проти race при prefetch; rollback optimistic-like при
  помилці swipe; like/unlike actions.
- `booking/[shelterId].tsx` — `isToday` у локальному часі; безпечний parse `shelterId`.
- `chat/ChatListView.tsx` — `useFocusEffect` для оновлення списку; пагінація size=50.

## Інфраструктура

- `infra/nginx/conf.d/swipet.conf` — HSTS лише для реальних доменів (не для
  `localhost`/`127.0.0.1`), щоб self-signed cert не «отруював» браузер.
- Nginx проксує MinIO через `/media/` (HTTPS, same-origin) проти mixed-content.

## Міграції БД

- `V12__demo_user.sql` — демо-користувач.
- `V13__guardianship_activation_and_unique.sql` — колонка `activation_tx_id`,
  `is_active DEFAULT false`, частковий unique-індекс активних опікунств.

> Усі міграції застосовуються Flyway автоматично під час старту бекенду.

---

## Що ще НЕ готово (TODO)

- **Справжнє авто-списання опікунства.** Поточний one-time Stripe Checkout не вміє
  автоматично списувати щомісяця — потрібні **Stripe Subscriptions** (PaymentIntent +
  збережений payment method). Зараз cron лише створює `PENDING`-донат + посилання, яке
  користувач має оплатити вручну; `next_billing_at` рухається лише після підтвердженої
  оплати. Це закриває небезпечну поведінку, але повноцінний recurring — окрема задача.
- **CI без тестового гейту.** Dockerfile збирає образ із `-x test`, а workflow
  `deploy-backend.yml` тести **не запускає** → регресії можуть доїхати до проду. Треба
  додати крок `./gradlew test` (або окремий PR-workflow).
- **ShedLock** не додавали — advisory-lock достатній для поточного масштабу, але для
  кількох інстансів із надійним leader-election варто розглянути.
- **Аналітика**: lost-update при неатомарних інкрементах лічильників — не чіпали.
- **Деплой фронтенду** (`deploy-frontend.yml`) — untracked, перевірити перед мерджем.

---

## ENV у проді (прокинуто в інфру)

Бекенд-код нових env не вводив, але прод-флоу оплати був неповний. Виправлено:

| ENV | Звідки у проді | Стан |
| --- | --- | --- |
| `STRIPE_API_KEY` | SSM `/<proj>/<env>/stripe_api_key` → user_data → `.env` → compose | було; **задати реальний `sk_live_…`** через tf var `stripe_api_key` |
| `STRIPE_WEBHOOK_SECRET` | SSM `/<proj>/<env>/stripe_webhook_secret` → user_data → `.env` → compose | було; **задати реальний `whsec_…`** через tf var `stripe_webhook_secret` |
| `APP_PUBLIC_URL` | `https://${frontend_fqdn}` → user_data → `.env` → compose | **ДОДАНО** (`ec2.tf`, `templates/user_data.sh.tftpl`, `files/docker-compose.prod.yml`) |

Локально ці три змінні присутні в `.env.example` та `docker-compose.yml`.

> ⚠️ Жива EC2 має `ignore_changes = [user_data]` — зміни user_data/compose НЕ
> переналаштовують бокс автоматично. Щоб підхопити `APP_PUBLIC_URL` на чинному
> інстансі: оновити `/opt/swipet/docker-compose.yml` + `/opt/swipet/.env` на хості
> (через SSM) і `docker compose up -d backend`, або зробити свідомий rebuild боксу.

GitHub Actions (перевірити що задані): `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
(secrets); `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN`, `SSM_INSTANCE_ID` (vars).