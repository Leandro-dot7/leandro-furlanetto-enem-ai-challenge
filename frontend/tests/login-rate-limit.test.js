import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearLoginAttempts,
  getLoginRateLimit,
  recordLoginAttempt,
} from '../src/lib/loginRateLimit.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test('bloqueia tentativas repetidas depois do limite e informa o restante', () => {
  const storage = createStorage();
  const now = 1_000_000;

  assert.equal(getLoginRateLimit(storage, now).allowed, true);
  for (let index = 0; index < 5; index += 1) recordLoginAttempt(storage, now + index);

  const result = getLoginRateLimit(storage, now + 10);
  assert.equal(result.allowed, false);
  assert.equal(result.remaining, 0);
  assert.ok(result.retryAfterSeconds > 0);
});

test('remove tentativas após a janela ou em um login bem-sucedido', () => {
  const storage = createStorage();
  const now = 2_000_000;

  recordLoginAttempt(storage, now);
  assert.equal(getLoginRateLimit(storage, now + 14 * 60 * 1000).allowed, true);
  assert.equal(getLoginRateLimit(storage, now + 15 * 60 * 1000 + 1).remaining, 5);

  recordLoginAttempt(storage, now + 15 * 60 * 1000 + 2);
  clearLoginAttempts(storage);
  assert.equal(getLoginRateLimit(storage, now + 15 * 60 * 1000 + 3).remaining, 5);
});

test('armazenamento indisponível não quebra o login', () => {
  const blocked = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };

  assert.doesNotThrow(() => recordLoginAttempt(blocked, 3_000_000));
  assert.doesNotThrow(() => clearLoginAttempts(blocked));
  assert.deepEqual(getLoginRateLimit(blocked, 3_000_000), {
    allowed: true,
    remaining: 5,
    retryAfterSeconds: 0,
  });
});
