// HTTP-клієнт до Core Backend (Spring). Chat-service НЕ має прямого доступу до БД —
// усі читання/записи йдуть через REST бекенду, який лишається єдиним власником даних.
//
// Контракт (ChatController, базовий шлях /api/v1/chats):
//   GET  /rooms?page&size                         → Page<ChatRoomResponse>     (membership)
//   GET  /rooms/{roomId}/messages?page&size        → Page<ChatMessageResponse>  (історія, sentAt DESC)
//   POST /internal/rooms/{roomId}/messages         → ChatMessageResponse        (збереження)
//
// Усі ендпоінти захищені JWT → передаємо токен користувача (з socket handshake) як Bearer.
import config from '../config.js';

const BASE = `${config.coreApiUrl}/api/v1/chats`;
const TIMEOUT_MS = 8000;

/**
 * Обгортка над fetch із таймаутом та обробкою помилок.
 * @returns {Promise<any>} розпарсений JSON
 * @throws {Error & { status?: number }}
 */
async function request(path, { method = 'GET', token, body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = new Error(`Core API ${method} ${path} → ${res.status}`);
      err.status = res.status;
      throw err;
    }

    // 204 / порожнє тіло
    if (res.status === 204) return null;
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Нормалізує ChatMessageResponse бекенду до стабільної форми для клієнта. */
function normalizeMessage(m) {
  return {
    id: m.id,
    roomId: m.roomId,
    senderId: m.senderId,
    content: m.content,
    sentAt: m.sentAt,
    isRead: m.isRead ?? false,
  };
}

export const coreApi = {
  /**
   * Останні повідомлення кімнати у хронологічному порядку (старі → нові).
   * Бекенд віддає sentAt DESC, тож розвертаємо.
   */
  async fetchHistory(roomId, token, size = config.limits.historySize) {
    const page = await request(`/rooms/${roomId}/messages?page=1&size=${size}`, { token });
    const content = Array.isArray(page?.content) ? page.content : [];
    return content.map(normalizeMessage).reverse();
  },

  /**
   * Зберігає повідомлення через internal-ендпоінт бекенду.
   * Повертає канонічне повідомлення з реальним id та sentAt.
   */
  async saveMessage(roomId, token, { senderId, content }) {
    const saved = await request(`/internal/rooms/${roomId}/messages`, {
      method: 'POST',
      token,
      body: { senderId, content },
    });
    return normalizeMessage(saved);
  },

  /**
   * Перевірка членства: чи входить кімната у список кімнат користувача.
   * @returns {Promise<boolean>}
   */
  async isRoomMember(roomId, token) {
    const page = await request(`/rooms?page=1&size=100`, { token });
    const content = Array.isArray(page?.content) ? page.content : [];
    return content.some((room) => String(room.id) === String(roomId));
  },
};
