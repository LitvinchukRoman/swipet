import type { User } from '@/store/auth';

/**
 * Utility functions for parsing and validating JSON Web Tokens.
 */
type Role = User['role'];

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** base64url → рядок. Використовує atob, якщо доступний (web/Hermes), інакше — ручний декодер. */
function base64UrlDecode(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';

  if (typeof atob === 'function') {
    try {
      return atob(str);
    } catch {
      /* fallthrough до ручного декодера */
    }
  }

  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const ch of str) {
    if (ch === '=') break;
    const idx = B64_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  [key: string]: unknown;
}

/** Декодує payload JWT без верифікації підпису (підпис перевіряє бекенд). */
export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

const VALID_ROLES: Role[] = ['USER', 'SHELTER_ADMIN', 'ADMIN'];

/**
 * Роль із access-токена (claim `role`). Потрібно, коли кеш `user` ще порожній
 * (напр. одразу після рестарту), але токен валідний — щоб root-гард не кидав
 * у USER-оболонку SHELTER_ADMIN/ADMIN.
 */
export function roleFromToken(token: string | null | undefined): Role | null {
  if (!token) return null;
  const role = decodeJwt(token)?.role;
  return role && (VALID_ROLES as string[]).includes(role) ? (role as Role) : null;
}
