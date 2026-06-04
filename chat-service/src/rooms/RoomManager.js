// CS-007 — менеджер кімнат у памʼяті.
//
// Тримає двосторонню відповідність: room → набір socketId, і socket → набір room,
// щоб і розсилати у кімнату, і швидко прибирати сокет звідусіль при disconnect.
//
// Це доповнення до вбудованих кімнат Socket.io (socket.join). Власна структура
// потрібна для явного контролю учасників, метрик і тестування без підняття io.

export class RoomManager {
  constructor() {
    /** @type {Map<string, Set<string>>} roomId → socketIds */
    this.roomToSockets = new Map();
    /** @type {Map<string, Set<string>>} socketId → roomIds */
    this.socketToRooms = new Map();
  }

  /** Додає сокет у кімнату. */
  join(roomId, socketId) {
    const room = String(roomId);

    if (!this.roomToSockets.has(room)) this.roomToSockets.set(room, new Set());
    this.roomToSockets.get(room).add(socketId);

    if (!this.socketToRooms.has(socketId)) this.socketToRooms.set(socketId, new Set());
    this.socketToRooms.get(socketId).add(room);
  }

  /** Прибирає сокет з однієї кімнати. */
  leave(roomId, socketId) {
    const room = String(roomId);

    const sockets = this.roomToSockets.get(room);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) this.roomToSockets.delete(room);
    }

    const rooms = this.socketToRooms.get(socketId);
    if (rooms) {
      rooms.delete(room);
      if (rooms.size === 0) this.socketToRooms.delete(socketId);
    }
  }

  /** Прибирає сокет з УСІХ кімнат (виклик при disconnect). */
  removeSocket(socketId) {
    const rooms = this.socketToRooms.get(socketId);
    if (!rooms) return;
    for (const room of rooms) {
      const sockets = this.roomToSockets.get(room);
      if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) this.roomToSockets.delete(room);
      }
    }
    this.socketToRooms.delete(socketId);
  }

  /** @returns {string[]} socketId-и у кімнаті. */
  getSocketIds(roomId) {
    const sockets = this.roomToSockets.get(String(roomId));
    return sockets ? [...sockets] : [];
  }

  /** Чи перебуває сокет у кімнаті. */
  isInRoom(roomId, socketId) {
    return this.roomToSockets.get(String(roomId))?.has(socketId) ?? false;
  }

  /** Кількість активних кімнат (для метрик/тестів). */
  get roomCount() {
    return this.roomToSockets.size;
  }
}
