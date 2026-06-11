# Swipet — звіт QA: знайдені баги та фікси

> Сесія мануального QA (фронт + бекенд), 2026-06.
> Статус: ✅ виправлено · ⚠️ відкрито (на рішення).

---

## Список багів

| # | Область | Severity | Баг | Статус |
|---|---------|----------|-----|--------|
| B1 | Frontend / валідація | High | Логіка «надійного» пароля розходиться з бекендом: фронт вважав пароль сильним лише за великими літерами й не вимагав цифру, тоді як бекенд вимагає мінімум одну літеру **і** одну цифру. | ✅ |
| B2 | Backend / auth | High | Пароль 73–100 символів проходив `@Size(max=100)`, але `BCryptPasswordEncoder` має жорсткий ліміт 72 байти → `IllegalArgumentException` → **HTTP 500** замість 400. | ✅ |
| B3 | Frontend / login | Medium | Помилки входу показувались через `Alert.alert(...)`, який на react-native-web **не відображається** → при невдалому вході візуально «нічого не відбувається». | ✅ |
| B4 | Frontend / build | High | `Dockerfile` не передавав `EXPO_PUBLIC_*` як build-arg. Expo вшиває ці змінні на етапі білда, а `environment:` у compose на статичний `expo export` не діє → бандл брав дефолт; по `http` виникав mixed-content і логін мовчки падав на https-сторінці. | ✅ |
| B5 | Backend / feed | Medium | `GET /api/v1/feed?limit=-5` → негативний `LIMIT` валив SQL-запит Postgres → **HTTP 500**. | ✅ |
| B6 | Backend / feed | Medium | `POST /api/v1/feed/swipe` з невалідним enum `direction` (напр. `"UP"`) або битим JSON → **HTTP 500** замість 400. | ✅ |
| B7 | Backend / animals | Low | `GET /api/v1/animals/abc` (нечисловий path-параметр) → **HTTP 500** замість 400. | ✅ |
| B8 | Frontend / feed | High | Геолокація фіду може **зависнути** (десктоп без GPS: дозвіл є, координат нема) — `getCurrentPositionAsync` без таймауту/`catch`. Користувач застрягав на оманливому `EmptyState` «You're all caught up!» без помилки; кнопка «Try again» лише перепитувала дозвіл, не перезавантажувала стрічку. | ✅ |
| B9 | Infra / MinIO | High | Завантажені через апку фото віддаються з `MINIO_PUBLIC_URL=http://localhost:9000` і блокуються браузером як mixed-content на https-сторінці (seed-фото працюють лише тому, що це https-URL Unsplash). | ⚠️ |
| B10 | Frontend / liked | High | Екран Favorites читає лише in-memory store (`useFeedStore(s => s.liked)`) і **жодного разу** не викликає реалізований `feedService.getLiked()` → улюблені не гідратуються з бекенду й зникають після перезавантаження. | ⚠️ |
| B11 | Backend / tests | Low | `SwipeServiceTest.recordSwipe_Success()` падав із `NullPointerException` — не замокано залежність `AnalyticsService`. | ✅ |
| B12 | Frontend / animal detail | High | `animal/[id].tsx`: `animalService.getById(Number(id))` без `.catch` — при помилці (404 / мережа / нечисловий id) `loading` лишався `true` назавжди → вічний скелетон, стан «Animal not found» недосяжний. | ✅ |
| B13 | Frontend / web feedback | High | Прямий `Alert.alert(...)` (який на react-native-web **no-op**) замість наявних web-safe `notify`/`confirm` у `profile/edit`, `DonationSheet`, `booking/[shelterId]`, `guardianship`. Фідбек невидимий на web; найгірше — **скасування опікунства на web не працювало взагалі** (confirm із кнопками = no-op, destructive `onPress` не викликався). | ✅ |
| B14 | Frontend / chat | Medium | `chat/[id].tsx`: `chatService.getMessages(roomId)` без `.catch` — при помилці REST-історії `loading` лишався `true` → вічний спінер у чаті. | ✅ |
| B15 | Frontend / shelter | Medium | `shelter/[id].tsx`: `animalService.getShelter(Number(id))` без `.catch` — при помилці екран висів на завантаженні; стан «Shelter not found» недосяжний. | ✅ |

---

## Фікси

### B1 — Єдине джерело правди для пароля на фронті
Створено `frontend/src/lib/password.ts` (правила 8..72, мінімум 1 літера + 1 цифра), `register.tsx` переведено на нього. Індикатор сили більше не позначає «strong» пароль, що не проходить бекенд, а підказки ведуть до реальних вимог бекенду.

### B2 — Узгодження довжини пароля з лімітом BCrypt
`backend/.../auth/dto/RegisterRequest.java`: `@Size(min = 8, max = 72)` (замість `max = 100`). Дзеркально оновлено `PASSWORD_MAX = 72` у `frontend/src/lib/password.ts` та `docs/api/CONTRACT.md`. Пароль >72 символів тепер дає коректний **400**, а не 500.

### B3 — Інлайн-помилка логіну
`frontend/src/app/(auth)/login.tsx`: замість `Alert` помилка пишеться під полем пароля через `setErrors({ password: msg })` (як у `register`). Імпорт `Alert` прибрано.

### B4 — `EXPO_PUBLIC_*` як build-arg
- `frontend/Dockerfile`: `ARG`/`ENV EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL` **перед** `npx expo export`.
- `docker-compose.yml`: ті самі змінні перенесено у `build.args`.
- `.env` / `.env.example`: значення змінено на `https://localhost/...`, щоб збігалося з TLS-origin nginx і не було mixed-content.

### B5 — Кламп `limit` у фіді
`backend/.../swipe/service/FeedService.java`:
```java
int fetchLimit = (limit != null && limit > 0) ? Math.min(limit, 100) : 20;
double searchRadius = radiusKm != null && radiusKm > 0 ? radiusKm : 50.0;
```
Негативний/нуль → дефолт 20; верхня межа 100.

### B6 / B7 — Централізована обробка невалідного інпуту → 400
`backend/.../common/exception/GlobalExceptionHandler.java`: додано два хендлери:
- `@ExceptionHandler(HttpMessageNotReadableException.class)` → 400 (битий JSON, невідоме значення enum) — закриває B6.
- `@ExceptionHandler(MethodArgumentTypeMismatchException.class)` → 400 (нечисловий path/query-параметр) — закриває B7.

### B8 — Стійка ініціалізація геолокації фіду
`frontend/src/app/(app)/(tabs)/index.tsx`: логіку винесено в `initLocation` з `try/catch` і таймаутом:
```ts
const position = await Promise.race([
  Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('location-timeout')), 10000)),
]) as Location.LocationObject;
```
Будь-який збій/зависання → `setLocationError(true)` → стан «Location access needed». Кнопку «Try again» переключено на `initLocation` (повний ре-флоу з перезавантаженням стрічки).

### B11 — Мок залежності в тесті
`backend/.../swipe/service/SwipeServiceTest.java`: додано `@Mock private AnalyticsService analyticsService;` (+ імпорт).

### B12 / B14 / B15 — `.catch` + `.finally` на екранах-завантаженнях
Додано обробку відмови промісу, щоб екран не зависав, а падав у досяжний стан помилки:
- `animal/[id].tsx`: `.catch(() => setAnimal(null)).finally(() => setLoading(false))` → рендериться «Animal not found».
- `chat/[id].tsx`: `.catch(() => {}).finally(() => setLoading(false))` → REST-помилка не блокує екран, сокет може догрузити.
- `shelter/[id].tsx`: `.catch(() => setShelter(null)).finally(() => setLoading(false))` → рендериться «Shelter not found».

### B13 — Прямий `Alert.alert` → web-safe `notify`/`confirm`
Замінено на хелпери з `frontend/src/lib/notify.ts` (на web → `window.alert`/`window.confirm`):
- `profile/edit.tsx`: 4 × `notify(...)` (Permission / Upload / Name required / Save failed).
- `components/common/DonationSheet.tsx`: 2 × `notify(...)` (Invalid amount / Payment error).
- `booking/[shelterId].tsx`: `notify('Booking failed', ...)`.
- `guardianship.tsx`: `handleCancel` → `const ok = await confirm(...)`; помилка → `notify(...)`. Тепер скасування опікунства працює на web.

---

## Відкриті (рекомендований фікс)

### B9 — MinIO через nginx TLS
Завантажені фото мають віддаватись по https. Варіанти: додати в nginx `location /media/` з проксі на MinIO та виставити `MINIO_PUBLIC_URL=https://localhost/media`, або поставити MinIO за TLS. Без цього будь-яке залите фото не відобразиться на https-фронті.

### B10 — Гідрація Liked з бекенду
Екран Favorites має на focus підтягувати `feedService.getLiked()` у store (наприклад, додати дію `loadLiked` + `useFocusEffect`), щоб улюблені переживали перезавантаження й бралися з сервера як джерела правди.
