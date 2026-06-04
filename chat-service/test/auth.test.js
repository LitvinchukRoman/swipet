// CS-013 — тести верифікації JWT (verifySocketToken).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import jwt from 'jsonwebtoken';

import config from '../src/config.js';
import { verifySocketToken } from '../src/lib/auth.js';

const sign = (payload, opts = {}) =>
  jwt.sign(payload, config.jwt.secret, {
    issuer: config.jwt.issuer,
    algorithm: 'HS256',
    expiresIn: '15m',
    ...opts,
  });

test('валідний токен → повертає userId, email, role', () => {
  const token = sign({ email: 'demo@swipet.ua', role: 'USER' }, { subject: '42' });
  const user = verifySocketToken(token);
  assert.equal(user.userId, 42);
  assert.equal(user.email, 'demo@swipet.ua');
  assert.equal(user.role, 'USER');
});

test('приймає префікс "Bearer "', () => {
  const token = sign({}, { subject: '7' });
  assert.equal(verifySocketToken(`Bearer ${token}`).userId, 7);
});

test('порожній токен → кидає', () => {
  assert.throws(() => verifySocketToken(''));
  assert.throws(() => verifySocketToken(undefined));
});

test('невірний підпис → кидає', () => {
  const forged = jwt.sign({ sub: '1' }, 'wrong-secret-wrong-secret-wrong-secret-xx', {
    issuer: config.jwt.issuer,
    algorithm: 'HS256',
  });
  assert.throws(() => verifySocketToken(forged));
});

test('невірний issuer → кидає', () => {
  const token = jwt.sign({ sub: '1' }, config.jwt.secret, {
    issuer: 'someone-else',
    algorithm: 'HS256',
  });
  assert.throws(() => verifySocketToken(token));
});

test('прострочений токен → кидає', () => {
  const token = sign({}, { subject: '1', expiresIn: '-1s' });
  assert.throws(() => verifySocketToken(token));
});
