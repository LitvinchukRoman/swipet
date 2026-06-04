// CS-015 — інтеграційний тест auth-handshake Socket.io.
//
// Перевіряємо лише авторизацію зʼєднання (локальний JWT) — без backend.
// Сценарії join_room / send_message потребують Core Backend і тут не покриваються.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import jwt from 'jsonwebtoken';
import { io as ioClient } from 'socket.io-client';

import config from '../src/config.js';
import { createChatServer } from '../src/server.js';

let httpServer;
let url;

before(async () => {
  ({ httpServer } = createChatServer());
  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      url = `http://localhost:${httpServer.address().port}`;
      resolve();
    });
  });
});

after(() => httpServer?.close());

const validToken = () =>
  jwt.sign({ email: 'demo@swipet.ua', role: 'USER' }, config.jwt.secret, {
    issuer: config.jwt.issuer,
    subject: '42',
    algorithm: 'HS256',
    expiresIn: '15m',
  });

function connect(token) {
  return ioClient(url, { auth: { token }, transports: ['websocket'], reconnection: false });
}

test('валідний токен → успішне зʼєднання', async () => {
  const client = connect(validToken());
  try {
    await new Promise((resolve, reject) => {
      client.on('connect', resolve);
      client.on('connect_error', (e) => reject(new Error(e.message)));
      setTimeout(() => reject(new Error('timeout')), 2000);
    });
    assert.ok(client.connected);
  } finally {
    client.disconnect();
  }
});

test('невалідний токен → connect_error "unauthorized"', async () => {
  const client = connect('garbage-token');
  try {
    const message = await new Promise((resolve, reject) => {
      client.on('connect', () => reject(new Error('should not connect')));
      client.on('connect_error', (e) => resolve(e.message));
      setTimeout(() => reject(new Error('timeout')), 2000);
    });
    assert.equal(message, 'unauthorized');
  } finally {
    client.disconnect();
  }
});
