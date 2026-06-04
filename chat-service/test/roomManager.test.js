// CS-014 — тести RoomManager (join / leave / removeSocket / getSocketIds).
import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { RoomManager } from '../src/rooms/RoomManager.js';

let rooms;
beforeEach(() => {
  rooms = new RoomManager();
});

test('join додає сокет у кімнату', () => {
  rooms.join(1, 'socket-a');
  assert.deepEqual(rooms.getSocketIds(1), ['socket-a']);
  assert.ok(rooms.isInRoom(1, 'socket-a'));
  assert.equal(rooms.roomCount, 1);
});

test('кілька сокетів в одній кімнаті', () => {
  rooms.join(1, 'a');
  rooms.join(1, 'b');
  assert.deepEqual(rooms.getSocketIds(1).sort(), ['a', 'b']);
});

test('roomId нормалізується (число і рядок — одна кімната)', () => {
  rooms.join(5, 'a');
  rooms.join('5', 'b');
  assert.equal(rooms.roomCount, 1);
  assert.equal(rooms.getSocketIds(5).length, 2);
});

test('leave прибирає сокет; порожня кімната видаляється', () => {
  rooms.join(1, 'a');
  rooms.join(1, 'b');
  rooms.leave(1, 'a');
  assert.deepEqual(rooms.getSocketIds(1), ['b']);
  rooms.leave(1, 'b');
  assert.equal(rooms.roomCount, 0);
});

test('removeSocket прибирає з усіх кімнат', () => {
  rooms.join(1, 'a');
  rooms.join(2, 'a');
  rooms.join(2, 'b');
  rooms.removeSocket('a');
  assert.equal(rooms.isInRoom(1, 'a'), false);
  assert.equal(rooms.isInRoom(2, 'a'), false);
  assert.deepEqual(rooms.getSocketIds(2), ['b']); // інші не зачеплені
});

test('getSocketIds для невідомої кімнати → []', () => {
  assert.deepEqual(rooms.getSocketIds(999), []);
});
