// CS-005/006 — збірка HTTP + Socket.io сервера.
//
// HTTP-шар мінімальний: лише /healthz для docker-compose healthcheck та nginx.
// Уся логіка — у Socket.io: auth-middleware на connect + реєстрація обробників подій.
import http from 'node:http';

import express from 'express';
import { Server as SocketIOServer } from 'socket.io';

import config from './config.js';
import { registerHandlers } from './handlers/registerHandlers.js';
import { verifySocketToken } from './lib/auth.js';
import logger from './logger.js';
import { RoomManager } from './rooms/RoomManager.js';

/**
 * Створює (але не запускає) HTTP + Socket.io сервер.
 * @returns {{ httpServer: http.Server, io: SocketIOServer, rooms: RoomManager }}
 */
export function createChatServer() {
  const app = express();
  const rooms = new RoomManager();

  // Healthcheck — використовується docker-compose та nginx
  app.get('/healthz', (_req, res) => res.status(200).type('text/plain').send('ok'));

  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: config.corsOrigins !== '*',
    },
  });

  // ── CS-006: auth-middleware — валідуємо JWT перед апгрейдом зʼєднання ──
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ?? socket.handshake.headers?.authorization ?? '';
      const user = verifySocketToken(token);
      // Зберігаємо профіль + сам токен (для прокидання у backend при збереженні повідомлень)
      socket.data = { ...user, token: token.startsWith('Bearer ') ? token.slice(7) : token };
      next();
    } catch (err) {
      logger.warn({ err: err.message }, 'socket auth rejected');
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug({ userId: socket.data.userId, socketId: socket.id }, 'connected');
    registerHandlers(io, socket, { rooms, log: logger });
  });

  return { httpServer, io, rooms };
}
