import assert from 'node:assert/strict';
import test from 'node:test';
import { readTheme, persistTheme } from '../src/context/themePreference.js';

test('tema respeita escolha persistida e rejeita valores desconhecidos', () => {
  assert.equal(readTheme({ getItem: () => 'dark' }), 'dark');
  assert.equal(readTheme({ getItem: () => 'light' }), 'light');
  assert.equal(readTheme({ getItem: () => 'invalid' }), 'light');
  assert.equal(readTheme({ getItem: () => null }), 'light');
});

test('armazenamento bloqueado não impede renderizar ou alternar tema', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(readTheme(blocked), 'light');
  assert.doesNotThrow(() => persistTheme(blocked, 'dark'));
  assert.equal(readTheme(undefined), 'light');
});

test('preferência é salva na chave usada pelo produto', () => {
  const saved = new Map();
  persistTheme({ setItem: (key, value) => saved.set(key, value) }, 'dark');
  assert.equal(saved.get('minerva-theme'), 'dark');
});
