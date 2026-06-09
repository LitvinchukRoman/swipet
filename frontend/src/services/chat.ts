import { api } from './api';
import type { ChatMessage, ChatRoom, Species } from '@/types/models';

// Chat REST API (ТЗ 3.6) — підключено до живого бекенду (ChatController /api/v1/chats).
// Real-time (socket) — окремо у lib/socket.ts + chat-service. Авторизація — Bearer (інтерсептор).
// Списки приходять як Spring Page<T> → дані у `data.content`.

// Backend DTO: ChatRoomResponse.
interface ChatRoomDTO {
  id: number;
  shelterId: number;
  shelterName: string;
  animalId: number;
  animalName: string;
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
    animal: {
      id: d.animalId,
      name: d.animalName,
      primaryPhotoUrl: d.animalPrimaryPhotoUrl,
      species: 'OTHER' as Species, // бекенд не віддає вид у списку кімнат
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
  getRooms: (): Promise<ChatRoom[]> =>
    api
      .get<Page<ChatRoomDTO>>('/chats/rooms', { params: { page: 1, size: 20 } })
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
   * Позначити прочитаним. REST-ендпоінта на бекенді НЕМАЄ —
   * read-квитанції йдуть через socket-подію `mark_read` (chat-service).
   * Лишаємо no-op для сумісності інтерфейсу.
   */
  markRead: (_roomId: number): Promise<void> => Promise.resolve(),
};
