const STORAGE_KEY = 'minerva-login-attempts';
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function readAttempts(storage, now) {
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    const attempts = JSON.parse(raw || '[]');
    if (!Array.isArray(attempts)) return [];
    return attempts
      .filter((timestamp) => Number.isFinite(timestamp) && timestamp > now - LOGIN_WINDOW_MS && timestamp <= now)
      .sort((left, right) => left - right);
  } catch {
    return [];
  }
}

export function getLoginRateLimit(storage, now = Date.now()) {
  const attempts = readAttempts(storage, now);
  const remaining = Math.max(0, LOGIN_MAX_ATTEMPTS - attempts.length);
  if (remaining > 0) {
    return { allowed: true, remaining, retryAfterSeconds: 0 };
  }

  const oldestAttempt = attempts[0] || now;
  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: Math.max(1, Math.ceil((oldestAttempt + LOGIN_WINDOW_MS - now) / 1000)),
  };
}

export function recordLoginAttempt(storage, now = Date.now()) {
  if (!storage) return;

  const attempts = readAttempts(storage, now);
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([...attempts, now]));
  } catch {
    // O bloqueio do storage não deve impedir o login ou derrubar a tela.
  }
}

export function clearLoginAttempts(storage) {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // O sucesso do login não depende da limpeza do storage local.
  }
}
