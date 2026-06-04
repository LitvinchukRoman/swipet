# chat-service

Realtime чат-сервіс на Node.js + Socket.io. Власник модуля — **Цьопич Андрій**.

Сервіс **не має прямого доступу до БД** — усі читання/записи йдуть через REST
Core Backend (`lib/coreApi.js`), який лишається єдиним власником даних. JWT
валідується **локально** тим самим `JWT_SECRET` (`lib/auth.js`), без мережевого
виклику на кожен connect.

## Структура

```
src/
├── index.js                  # bootstrap + graceful shutdown
├── config.js                 # env
├── logger.js                 # pino
├── server.js                 # express /healthz + Socket.io + auth middleware
├── lib/
│   ├── auth.js               # verifySocketToken (HS256 + issuer)
│   └── coreApi.js            # HTTP-клієнт до Spring (history, saveMessage, membership)
├── rooms/RoomManager.js      # Map<roomId, Set<socketId>>
└── handlers/registerHandlers.js
test/                         # node:test (auth, RoomManager, socket handshake)
```

## Контракт

- HTTP/healthz: `GET /healthz` → `200 "ok"`
- Socket.io шлях: `/socket.io/*` (дефолтний)
- Auth: JWT у `socket.handshake.auth.token`, ключ — `JWT_SECRET` (той самий, що у backend).

### Події Socket.io (ТЗ 3.9)

| Напрям | Подія | Payload |
| --- | --- | --- |
| client → server | `join_room` | `{ roomId }` |
| client → server | `send_message` | `{ roomId, content }` (≤2000 символів) |
| client → server | `mark_read` | `{ roomId }` |
| client → server | `typing` | `{ roomId, isTyping }` |
| server → client | `room_joined` | `{ roomId, history[] }` (останні 20) |
| server → client | `new_message` | `{ id, roomId, senderId, content, sentAt, isRead }` |
| server → client | `user_typing` | `{ roomId, userId, isTyping }` |
| server → client | `messages_read` | `{ roomId, readerId }` |
| server → client | `error` | `{ message }` |

Збереження повідомлень — через `POST ${CORE_API_URL}/api/v1/chats/internal/rooms/{roomId}/messages`
(токен користувача прокидається як Bearer).

## Запуск і тести

```bash
npm install
npm start      # node src/index.js
npm test       # node --test
```

## ENV

| змінна | приклад | опис |
| --- | --- | --- |
| `PORT` | `3001` | HTTP/Socket.io порт |
| `JWT_SECRET` | той самий, що у backend | локальна верифікація токена (HS256) |
| `JWT_ISSUER` | `swipet-backend` | очікуваний issuer токена |
| `CORE_API_URL` | `http://backend:8080` | базовий URL Core Backend |
| `FRONTEND_URL` | `http://localhost:8081` | дозволені origins для Socket.io CORS (кома-розділені) |
