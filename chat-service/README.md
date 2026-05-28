# chat-service

Realtime чат-сервіс на Node.js + Socket.io. Власник модуля — **Цьопич Андрій**.

Цей каталог наразі містить лише placeholder, який слухає `:3001/healthz` —
достатньо щоб `docker-compose up` піднімав весь стек до того моменту,
поки повна реалізація не буде змержена з гілок `feature/CH-*`.

## Контракт

- HTTP/healthz: `GET /healthz` → `200 "ok"`
- Socket.io шлях: `/socket.io/*` (дефолтний)
- Auth: JWT у `socket.handshake.auth.token`, ключ — `JWT_SECRET` (той самий, що у backend).
- Перевірка валідності токена робиться через виклик `${CORE_API_URL}/api/v1/auth/verify`.

## ENV

| змінна | приклад | опис |
| --- | --- | --- |
| `PORT` | `3001` | HTTP/Socket.io порт |
| `JWT_SECRET` | той самий, що у backend | для локальної верифікації токена |
| `CORE_API_URL` | `http://backend:8080` | базовий URL Core Backend |
| `DB_URL` | `postgresql://...` | (опційно) для прямого читання історії |
