import { api } from './api';
import type { ChatMessage, ChatRoom, Species } from '@/types/models';

// Chat REST API (ТЗ 3.6) — підключено до живого бекенду (ChatController /api/v1/chats).
// Real-time (socket) — окремо у lib/socket.ts + chat-service. Авторизація — Bearer (інтерсептор).
// Списки приходять як Spring Page<T> → дані у `data.content`.

// Backend DTO: ChatRoomResponse.
interface ChatRoomDTO {
  id: number;
  userId: number;
  userName: string;
  shelterId: number;
  shelterName: string;
  animalId: number;
  animalName: string;
  animalSpecies?: string;
  animalPrimaryPhotoUrl?: string;
  lastMessageAt?: string;
  // ⚠️ бекенд поки НЕ повертає текст останнього повідомлення та лічильник непрочитаних
  lastMessage?: string;
  unreadCount?: number;
}

// Backend DTO: ChatMessageResponse.
interface ChatMessageDTO {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  sentAt: string;
  isRead: boolean;
}

interface Page<T> {
  content: T[];
}

function mapRoom(d: ChatRoomDTO): ChatRoom {
  return {
    id: d.id,
    user: { id: d.userId, name: d.userName ?? '' },
    animal: {
      id: d.animalId,
      name: d.animalName,
      primaryPhotoUrl: d.animalPrimaryPhotoUrl,
      species: (d.animalSpecies as Species) ?? ('OTHER' as Species),
    },
    shelter: { id: d.shelterId, name: d.shelterName },
    lastMessage: d.lastMessage,
    lastMessageAt: d.lastMessageAt,
    unreadCount: d.unreadCount ?? 0,
  };
}

function mapMessage(d: ChatMessageDTO): ChatMessage {
  return {
    id: d.id,
    roomId: d.roomId,
    senderId: d.senderId,
    content: d.content,
    isRead: d.isRead,
    sentAt: d.sentAt,
  };
}

export const chatService = {
  /** Список кімнат. GET /chats/rooms */
  getRooms: (page = 1, size = 50): Promise<ChatRoom[]> =>
    api
      .get<Page<ChatRoomDTO>>('/chats/rooms', { params: { page, size } })
      .then((r) => r.data.content.map(mapRoom)),

  /** Історія кімнати (новіші першими → розвертаємо). GET /chats/rooms/:id/messages */
  getMessages: (roomId: number): Promise<ChatMessage[]> =>
    api
      .get<Page<ChatMessageDTO>>(`/chats/rooms/${roomId}/messages`, { params: { page: 1, size: 20 } })
      .then((r) => r.data.content.map(mapMessage).reverse()),

  /** Створити/отримати кімнату. POST /chats/rooms?shelterId&animalId (userId — з JWT) */
  createRoom: (animalId: number, shelterId: number): Promise<{ roomId: number }> =>
    api
      .post<ChatRoomDTO>('/chats/rooms', null, { params: { shelterId, animalId } })
      .then((r) => ({ roomId: r.data.id })),

  /**
   * Позначити повідомлення кімнати прочитаними (персистить is_read=true на бекенді).
   * POST /chats/rooms/:id/read. Викликається при відкритті кімнати, щоб лічильник
   * непрочитаних обнулявся у списку чатів. Socket-подія `mark_read` — окремо, для
   * realtime read-receipt іншому учаснику.
   */
  markRead: (roomId: number): Promise<void> =>
    api.post(`/chats/rooms/${roomId}/read`).then(() => undefined),
};
