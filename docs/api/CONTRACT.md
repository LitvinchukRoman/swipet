# Swipet API contract

Everything is versioned under `/api/v1`. This is a *contract document* —
endpoints marked **🚧 not implemented** are reserved by other modules
(Корявець / Цьопич) and are documented here so all services agree on the
shape ahead of time. Endpoints marked **✅** are merged on `develop`.

> Source of truth at runtime: Swagger UI at `https://localhost/swagger-ui/`.
> If Swagger and this doc disagree on an *implemented* endpoint — Swagger wins
> and this file should be updated.

## Conventions

- Authentication: `Authorization: Bearer <accessToken>`.
- Content type: `application/json` unless explicitly noted (uploads use
  `multipart/form-data`).
- Time: ISO-8601, UTC (`2026-05-28T18:43:11Z`).
- IDs: `BIGINT` (a JSON number that fits in `Long`); we never emit `null`
  IDs.
- Pagination: `?page=0&limit=20`, response includes `{ items, hasMore, page }`.
- Sorting: documented per endpoint when relevant.

### Error envelope

All non-2xx responses follow:

```jsonc
{
  "error": "VALIDATION_FAILED",       // machine-readable code
  "message": "Request validation failed",
  "statusCode": 400,
  "timestamp": "2026-05-28T19:11:23.412Z",
  "path": "/api/v1/auth/register",
  "violations": [                     // present for VALIDATION_FAILED
    { "field": "password", "message": "Password must be 8..100 chars" }
  ]
}
```

Common codes: `VALIDATION_FAILED`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
`CONFLICT`, `BAD_REQUEST`, `INTERNAL_ERROR`.

---

## 3.1 Auth — `/api/v1/auth` ✅ implemented

### POST `/register`
Reg. body:

```json
{
  "email": "alice@swipet.io",
  "password": "Password1!",
  "fullName": "Alice"
}
```

`201 Created`:

```jsonc
{
  "userId": 7,
  "message": "User registered",
  "tokens": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "9f4d3e62-...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": { /* see UserResponse */ }
  }
}
```

`409 CONFLICT` if email is taken. Password must contain at least one letter
and one digit, length 8..100.

### POST `/login`
Body: `{ email, password }`. `200 OK` returns the same `TokenResponse` as
above (without the wrapper).

`401 UNAUTHORIZED` if credentials are wrong.

### POST `/refresh`
Body: `{ "refreshToken": "<uuid>" }`.

Returns a freshly issued `TokenResponse`. **Refresh-token rotation is
enforced** — the old refresh token is revoked atomically; reusing it
returns `401 UNAUTHORIZED` (`Refresh token expired or revoked`).

### POST `/logout`
Body: `{ "refreshToken": "<uuid>" }`. `200 OK`, marks the token revoked.
Idempotent — unknown tokens silently succeed.

### GET `/me` *(auth required)*
Returns:

```jsonc
{
  "id": 7,
  "email": "alice@swipet.io",
  "fullName": "Alice",
  "phone": null,
  "avatarUrl": null,
  "role": "USER",
  "isEmailVerified": false,
  "createdAt": "2026-05-28T18:43:11.000Z"
}
```

### GET `/verify` *(auth required)*
Returns `{ "valid": true, "userId": 7, "role": "USER" }`. Designed to be
called by **chat-service** on WebSocket handshake.

---

## 3.2 Users — `/api/v1/users` 🚧 owned by Корявець

| Method | Path | Auth | Body / Params | Response |
| --- | --- | --- | --- | --- |
| GET | `/:id` | optional | — | public profile |
| PATCH | `/me` | required | `fullName?, phone?, avatarUrl?` | updated `UserResponse` |
| PATCH | `/me/location` | required | `lat, lng` | `{ message }` |
| POST | `/me/avatar` | required | `multipart: file` | `{ avatarUrl }` |

> Note (Літвінчук): `POST /me/avatar` will use `MinioStorageService.uploadFile`
> already merged in `common/storage`. Validation: `image/{jpeg,png,webp,gif}`,
> max 5 MiB.

---

## 3.3 Shelters — `/api/v1/shelters` 🚧

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/register` | `USER` → upgraded to `SHELTER_ADMIN` | `{ name, address, city, lat, lng, phone? }` | `{ shelter }` |
| GET | `/:id` | optional | — | `{ shelter, animals[] }` |
| PATCH | `/:id` | `SHELTER_ADMIN` (owner) | partial update | `{ shelter }` |
| GET | `/me/analytics` | `SHELTER_ADMIN` | `?dateFrom&dateTo` | analytics aggregation |

---

## 3.4 Animals — `/api/v1/animals` 🚧 (CRUD already started by Корявець)

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/` | `SHELTER_ADMIN`/`ADMIN` | `AnimalRequest` | `AnimalResponse` |
| GET | `/:id` | — | — | `AnimalResponse` |
| PATCH | `/:id` | owner | partial update | `AnimalResponse` |
| DELETE | `/:id` | owner | — | 204 |
| POST | `/:id/photos` | owner | `multipart: file, sortOrder?` | `PhotoResponse` |
| DELETE | `/:id/photos/:photoId` | owner | — | 204 |

---

## 3.5 Feed — `/api/v1/feed` 🚧

| Method | Path | Query / Body | Response |
| --- | --- | --- | --- |
| GET | `/` | `lat, lng, radiusKm?=50, species?, ageMax?, size?, limit?=20` | `{ animals[]: { id, name, species, primaryPhotoUrl, ageMonths, size, shelterName, distanceKm } }` |
| POST | `/swipe` | `{ animalId, direction: LEFT|RIGHT }` | `{ swipeId }`; `409` on duplicate |
| GET | `/liked` | `?page&limit` | `{ animals[] }` |

> RIGHT swipe **does NOT** auto-create a chat room — the room is created
> when the user explicitly hits “Написати” (see 3.6).

---

## 3.6 Chat Rooms — `/api/v1/chat` 🚧

| Method | Path | Body / Params | Response |
| --- | --- | --- | --- |
| POST | `/rooms` | `{ animalId, shelterId }` | `{ room }` |
| GET | `/rooms` | — | `{ rooms[]: { id, animal, shelter, lastMessage, unreadCount } }` |
| GET | `/rooms/:id/messages` | `?page&limit` | `{ messages[], hasMore }` |
| POST | `/rooms/:id/read` | — | `{ message }` |

Realtime channel — see 3.9.

---

## 3.7 Donations & Guardianship — `/api/v1/donations` 🚧

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/one-time` | `{ shelterId, animalId?, amount }` | `{ paymentUrl }` |
| POST | `/guardianship` | `{ animalId, monthlyAmount }` | `{ guardianship, paymentUrl }` |
| DELETE | `/guardianship/:id` | — | 204 |
| GET | `/my-guardianships` | — | `{ guardianships[] }` |
| POST | `/webhook` | gateway payload | 200 |

---

## 3.8 Booking — `/api/v1/booking` 🚧

| Method | Path | Body / Params | Response |
| --- | --- | --- | --- |
| GET | `/slots` | `?shelterId&date` | `{ slots[] }` |
| POST | `/slots` | `{ shelterId, startsAt, endsAt }` | `{ slot }` |
| POST | `/slots/:id/book` | `{ notes? }` | `{ booking }` |
| DELETE | `/slots/:id/book` | — | 204 |

---

## 3.9 Realtime (Socket.io) — chat-service `:3001` 🚧 owned by Цьопич

Connection:

```ts
io("https://localhost", {
  path: "/socket.io",
  auth: { token: accessJwt }
});
```

The server validates `auth.token` either by hitting `GET /api/v1/auth/verify`
on the Core Backend, or — preferably — by verifying the JWT locally with the
shared `JWT_SECRET`.

| Direction | Event | Payload | Notes |
| --- | --- | --- | --- |
| C→S | `join_room` | `{ roomId }` | server replies with `room_joined` |
| C→S | `send_message` | `{ roomId, content }` | persisted to `chat_messages` |
| C→S | `mark_read` | `{ roomId }` | flips `is_read = true` for messages |
| C→S | `typing` | `{ roomId, isTyping }` | broadcast only; not persisted |
| S→C | `room_joined` | `{ roomId, history[] }` | last 20 messages |
| S→C | `new_message` | `{ id, roomId, senderId, content, sentAt }` | |
| S→C | `user_typing` | `{ roomId, userId, isTyping }` | |
| S→C | `error` | `{ message }` | unauthorized, room not found, … |

---

## Status legend

- ✅ — implemented in `develop`, covered by tests.
- 🚧 — contract-only; not yet wired up.
- ❌ — explicitly out of MVP scope.
