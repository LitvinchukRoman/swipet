// CS-004 — верифікація JWT із socket handshake.
//
// Токен підписаний Core Backend (HS256) тим самим JWT_SECRET. Перевіряємо локально,
// без мережевого виклику — це швидко (на кожен connect) і не залежить від доступності backend.
// Claims (див. backend JwtService): sub=userId, email, role, iss.
import jwt from 'jsonwebtoken';

import config from '../config.js';

/**
 * @typedef {Object} SocketUser
 * @property {number} userId
 * @property {string} [email]
 * @property {string} [role]
 */

/**
 * Декодує та валідує access-токен.
 * @param {string} token «голий» JWT (без префікса Bearer)
 * @returns {SocketUser}
 * @throws {Error} якщо токен відсутній, прострочений, з невірним підписом або issuer
 */
export function verifySocketToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('No token provided');
  }

  // Дозволяємо обидва формати: «Bearer xxx» та просто «xxx»
  const raw = token.startsWith('Bearer ') ? token.slice(7) : token;

  const payload = jwt.verify(raw, config.jwt.secret, {
    issuer: config.jwt.issuer,
    algorithms: config.jwt.algorithms,
  });

  const userId = Number(payload.sub);
  if (!Number.isFinite(userId)) {
    throw new Error('Token has no valid subject (userId)');
  }

  return {
    userId,
    email: payload.email,
    role: payload.role,
  };
}
