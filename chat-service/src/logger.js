// Структуроване логування через pino.
// У дев-режимі — людиночитабельний вивід без зайвих полів; у проді — JSON.
import pino from 'pino';

import config from './config.js';

const logger = pino({
  level: process.env.LOG_LEVEL ?? (config.isProd ? 'info' : 'debug'),
  base: { service: 'chat-service' },
  transport: config.isProd
    ? undefined
    : {
        target: 'pino/file', // без pino-pretty (не у залежностях) — пишемо у stdout
        options: { destination: 1 },
      },
});

export default logger;
