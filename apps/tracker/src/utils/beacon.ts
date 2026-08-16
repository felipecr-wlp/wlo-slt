export function sendBeacon(endpoint: string, payload: unknown): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    return navigator.sendBeacon(endpoint, blob);
  }
  return false;
}

let fallbackFetch: typeof fetch | null = null;
export function setFallbackFetch(fn: typeof fetch | null) {
  fallbackFetch = fn;
}

export function fallbackSend(endpoint: string, payload: unknown): Promise<void> {
  const fn = fallbackFetch || (typeof fetch !== 'undefined' ? fetch.bind(window) : null);
  if (!fn) return Promise.resolve();
  return fn(endpoint, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(() => {}).catch(() => {});
}
