import type { ChatMessage, ChatRoom } from '@/types/models';

import { delay, MOCK_CHAT_ROOMS, MOCK_MESSAGES } from './mock';
// import { api } from './api'; // ← розкоментувати коли бекенд готовий

/**
 * Chat REST API (ТЗ 3.6). Real-time частина (Socket.io) — окремо у chat-service.
 * Зараз повертає мок-дані.
 */
export const chatService = {
  // GET /chat/rooms
  getRooms: async (): Promise<ChatRoom[]> => {
    // TODO: return api.get('/chat/rooms').then(r => r.data.rooms);
    return delay(MOCK_CHAT_ROOMS);
  },

  // GET /chat/rooms/:id/messages
  getMessages: async (roomId: number): Promise<ChatMessage[]> => {
    // TODO: return api.get(`/chat/rooms/${roomId}/messages`).then(r => r.data.messages);
    return delay(MOCK_MESSAGES[roomId] ?? []);
  },

  // POST /chat/rooms
  createRoom: async (animalId: number, shelterId: number): Promise<{ roomId: number }> => {
    // TODO: return api.post('/chat/rooms', { animalId, shelterId }).then(r => r.data);
    return delay({ roomId: 101 }, 200);
  },

  // POST /chat/rooms/:id/read
  markRead: async (roomId: number): Promise<void> => {
    // TODO: return api.post(`/chat/rooms/${roomId}/read`);
    return delay(undefined, 100);
  },
};
