// CS-008..012 — реєстрація обробників подій для одного підключеного сокета.
//
// Контракт подій (ТЗ 3.9):
//   client → server: join_room, send_message, mark_read, typing
//   server → client: room_joined, new_message, user_typing, messages_read, error
//
// socket.data заповнюється auth-middleware у server.js: { userId, email, role, token }.
import config from '../config.js';
import { coreApi } from '../lib/coreApi.js';

/** Імʼя Socket.io-кімнати за її id. */
const roomName = (roomId) => `room:${roomId}`;

/** Відправити стандартизовану помилку клієнту. */
function emitError(socket, message) {
  socket.emit('error', { message });
}

/**
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {{ rooms: import('../rooms/RoomManager.js').RoomManager, log: import('pino').Logger }} deps
 */
export function registerHandlers(io, socket, { rooms, log }) {
  const { userId, token } = socket.data;

  // ── CS-008: приєднання до кімнати ──────────────────────────────
  socket.on('join_room', async (payload) => {
    const roomId = payload?.roomId;
    if (roomId == null) return emitError(socket, 'roomId is required');

    try {
      // Перевірка членства: користувач має бути учасником кімнати
      const isMember = await coreApi.isRoomMember(roomId, token);
      if (!isMember) {
        log.warn({ userId, roomId }, 'join denied — not a member');
        return emitError(socket, 'Room not found or access denied');
      }

      socket.join(roomName(roomId));
      rooms.join(roomId, socket.id);

      const history = await coreApi.fetchHistory(roomId, token);
      socket.emit('room_joined', { roomId, history });
      log.debug({ userId, roomId, count: history.length }, 'room_joined');
    } catch (err) {
      log.error({ err: err.message, userId, roomId }, 'join_room failed');
      emitError(socket, 'Could not join room');
    }
  });

  // ── CS-009: надсилання повідомлення ────────────────────────────
  socket.on('send_message', async (payload) => {
    const roomId = payload?.roomId;
    const content = typeof payload?.content === 'string' ? payload.content.trim() : '';

    if (roomId == null) return emitError(socket, 'roomId is required');
    if (!content) return emitError(socket, 'Message is empty');
    if (content.length > config.limits.maxMessageLength) {
      return emitError(socket, `Message exceeds ${config.limits.maxMessageLength} characters`);
    }
    if (!rooms.isInRoom(roomId, socket.id)) {
      return emitError(socket, 'Join the room before sending messages');
    }

    try {
      // Збереження через backend (єдине джерело правди), потім розсилка всім у кімнаті
      const saved = await coreApi.saveMessage(roomId, token, { senderId: userId, content });
      io.to(roomName(roomId)).emit('new_message', saved);
      log.debug({ userId, roomId, messageId: saved.id }, 'new_message');
    } catch (err) {
      log.error({ err: err.message, userId, roomId }, 'send_message failed');
      emitError(socket, 'Could not send message');
    }
  });

  // ── CS-010: позначити прочитаним ───────────────────────────────
  // TODO(backend): персистити is_read=true коли zʼявиться ендпоінт (зараз — лише realtime-квитанція).
  socket.on('mark_read', (payload) => {
    const roomId = payload?.roomId;
    if (roomId == null) return;
    socket.to(roomName(roomId)).emit('messages_read', { roomId, readerId: userId });
  });

  // ── CS-011: індикатор набору тексту ────────────────────────────
  socket.on('typing', (payload) => {
    const roomId = payload?.roomId;
    if (roomId == null) return;
    socket.to(roomName(roomId)).emit('user_typing', {
      roomId,
      userId,
      isTyping: Boolean(payload?.isTyping),
    });
  });

  // ── CS-012: відключення ────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    rooms.removeSocket(socket.id);
    log.debug({ userId, socketId: socket.id, reason }, 'disconnected');
  });
}
