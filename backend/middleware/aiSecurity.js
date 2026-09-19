const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const requestsByUser = new Map();

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ''), key } : null;
}

/** Validates a Supabase session before allowing paid AI operations. */
export async function requireSupabaseUser(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabase = getSupabaseConfig();

  if (!token) return res.status(401).json({ error: 'Autenticação obrigatória.' });
  if (!supabase) {
    console.error('[auth] SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY não configurada.');
    return res.status(503).json({ error: 'Autenticação indisponível no momento.' });
  }

  try {
    const response = await fetch(`${supabase.url}/auth/v1/user`, {
      headers: { apikey: supabase.key, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });

    const user = await response.json();
    if (!user?.id) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    req.authUser = { id: user.id };
    return next();
  } catch (error) {
    console.error('[auth] Falha ao validar sessão:', error.message);
    return res.status(503).json({ error: 'Não foi possível validar sua sessão. Tente novamente.' });
  }
}

/** In-memory limit; use a shared store such as Redis when scaling horizontally. */
export function aiRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.authUser.id;
  const record = requestsByUser.get(key);
  if (!record || now >= record.resetAt) {
    requestsByUser.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Limite de solicitações de IA atingido. Tente novamente em alguns minutos.' });
  }
  record.count += 1;
  return next();
}
