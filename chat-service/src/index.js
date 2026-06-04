// Точка входу chat-service.
//
// Owner: Цьопич Андрій (CS-001..CS-015).
// Realtime чат на Node.js + Socket.io. БД напряму не торкаємось — усі дані
// йдуть через Core Backend (див. lib/coreApi.js). JWT валідуємо локально (lib/auth.js).
import config from './config.js';
import logger from './logger.js';
import { createChatServer } from './server.js';

const { httpServer } = createChatServer();

httpServer.listen(config.port, () => {
  logger.info(
    { port: config.port, coreApiUrl: config.coreApiUrl },
    'chat-service listening',
  );
});

// Грейсфул-шатдаун для контейнера
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    logger.info({ signal }, 'shutting down');
    httpServer.close(() => process.exit(0));
  });
}
