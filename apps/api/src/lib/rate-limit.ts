// Rate limiter simple (demo). En producción usar Vercel KV.
// No lanza en Edge: si falla, permite el request para no romper el flujo.
type Entry = { count: number; reset: number; blockedUntil?: number };
const store = new Map<string, Entry>();

export async function rateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  try {
    const key = `${identifier}:${endpoint}`;
    const now = Date.now();
    const reset = now + windowMs;
    const current = store.get(key);
    if (!current || current.reset <= now) {
      store.set(key, { count: 1, reset });
    } else {
      current.count += 1;
      if (current.count > limit) {
        current.blockedUntil = now + windowMs;
      }
      store.set(key, current);
    }
    const e = store.get(key)!;
    const allowed = !e.blockedUntil || e.blockedUntil <= now;
    return {
      allowed,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(Math.max(0, limit - e.count)),
        'X-RateLimit-Reset': String(e.reset),
      },
    };
  } catch {
    return { allowed: true, headers: {} };
  }
}
