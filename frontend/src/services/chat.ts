import type { ChatMessage, ChatRoom, Species } from '@/types/models';
import { api } from './api';

// Chat REST API - connected to the backend (ChatController /api/v1/chats).
// Real-time (socket) - handled separately in lib/socket.ts + chat-service. Auth is Bearer (interceptor).
// Lists are returned as Spring Page<T> -> data is in `data.content`.

// Backend DTO: ChatRoomResponse.
interface ChatRoomDTO {
  id: number;
  userId: number;
  userName: string;
  userAvatarUrl?: string;
  shelterId: number;
  shelterName: string;
  animalId: number;
  animalName: string;
  animalSpecies?: string;
  animalPrimaryPhotoUrl?: string;
  lastMessageAt?: string;
  // ⚠️ the backend currently DOES NOT return the last message text and unread count
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
    user: { id: d.userId, name: d.userName ?? '', avatarUrl: d.userAvatarUrl },
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
  /** Room list. GET /chats/rooms */
  getRooms: (page = 1, size = 50): Promise<ChatRoom[]> =>
    api
      .get<Page<ChatRoomDTO>>('/chats/rooms', { params: { page, size } })
      .then((r) => r.data.content.map(mapRoom)),

  /** Room history (newest first -> we reverse it). GET /chats/rooms/:id/messages */
  getMessages: (roomId: number): Promise<ChatMessage[]> =>
    api
      .get<Page<ChatMessageDTO>>(`/chats/rooms/${roomId}/messages`, { params: { page: 1, size: 20 } })
      .then((r) => r.data.content.map(mapMessage).reverse()),

  /** Create/get a room. POST /chats/rooms?shelterId&animalId (userId is from JWT) */
  createRoom: (animalId: number, shelterId: number): Promise<{ roomId: number }> =>
    api
      .post<ChatRoomDTO>('/chats/rooms', null, { params: { shelterId, animalId } })
      .then((r) => ({ roomId: r.data.id })),

  /**
   * Mark room messages as read (persists is_read=true on the backend).
   * POST /chats/rooms/:id/read. Called when a room is opened, to reset the
   * unread count in the chat list. The socket event `mark_read` is separate, for
   * realtime read-receipts to the other participant.
   */
  markRead: (roomId: number): Promise<void> =>
    api.post(`/chats/rooms/${roomId}/read`).then(() => undefined),
};
