// Централізована конфігурація сервісу зі змінних середовища.
// Завантажується один раз при старті; усі модулі імпортують готовий обʼєкт.

/**
 * Дефолтний секрет збігається з дев-дефолтом Core Backend (application.yaml),
 * щоб у локальному запуску без .env токени все одно валідувались.
 * У docker-compose / проді JWT_SECRET передається явно і має бути однаковим у обох сервісах.
 */
const DEV_FALLBACK_SECRET =
  'change-me-please-min-256-bit-secret-change-me-please-min-256-bit-secret';

const config = {
  port: Number(process.env.PORT ?? 3001),

  // JWT — мають точно збігатися з налаштуваннями Core Backend (auth модуль)
  jwt: {
    secret: process.env.JWT_SECRET ?? DEV_FALLBACK_SECRET,
    issuer: process.env.JWT_ISSUER ?? 'swipet-backend',
    algorithms: ['HS256'],
  },

  // Базовий URL Core Backend (Spring). Node ходить сюди по історію та для збереження повідомлень.
  coreApiUrl: (process.env.CORE_API_URL ?? 'http://backend:8080').replace(/\/+$/, ''),

  // Дозволені джерела для Socket.io CORS (кома-розділений список або '*').
  corsOrigins: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
    : '*',

  // Бізнес-обмеження з ТЗ
  limits: {
    maxMessageLength: 2000, // CS-009
    historySize: 20, // room_joined повертає останні 20 (ТЗ 3.9)
  },

  isProd: process.env.NODE_ENV === 'production',
};

export default config;
