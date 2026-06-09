import { io, type Socket } from 'socket.io-client';

// Типізований клієнт до chat-service (Socket.io). Контракт подій — ТЗ 3.9,
// дзеркалить server: handlers/registerHandlers.js.

export interface ChatMessageDTO {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  sentAt: string;
  isRead?: boolean;
}

// server → client
interface ServerToClientEvents {
  room_joined: (p: { roomId: number; history: ChatMessageDTO[] }) => void;
  new_message: (m: ChatMessageDTO) => void;
  user_typing: (p: { roomId: number; userId: number; isTyping: boolean }) => void;
  messages_read: (p: { roomId: number; readerId: number }) => void;
  error: (p: { message: string }) => void;
}

// client → server
interface ClientToServerEvents {
  join_room: (p: { roomId: number }) => void;
  send_message: (p: { roomId: number; content: string }) => void;
  mark_read: (p: { roomId: number }) => void;
  typing: (p: { roomId: number; isTyping: boolean }) => void;
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Дефолт — HTTPS (див. api.ts): веб по https://localhost, інакше mixed content.
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'https://localhost';

let socket: ChatSocket | null = null;
let currentToken: string | null = null;

/**
 * Повертає підключений сокет, створюючи його за потреби.
 * Якщо токен змінився — перепідключаємось.
 * Обмежені reconnection-спроби: якщо сервіс недоступний (напр. чистий фронт-дев),
 * екран має змогу відкотитись на mock через подію connect_error.
 */
export function connectSocket(token: string): ChatSocket {
  if (socket && currentToken === token) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    timeout: 5000,
    reconnectionAttempts: 3,
    autoConnect: true,
  });

  return socket;
}

export function getSocket(): ChatSocket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}
