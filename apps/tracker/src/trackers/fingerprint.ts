const STORAGE_KEY = '__slt_session';
const FP_KEY = '__slt_fingerprint';

export class Fingerprint {
  static generate(): string {
    if (typeof window === 'undefined') return 'server';
    const parts: string[] = [];
    const nav = navigator;
    parts.push(navigator.userAgent || '');
    parts.push(navigator.language || '');
    parts.push(screen.width + 'x' + screen.height);
    parts.push(new Date().getTimezoneOffset().toString());
    parts.push(navigator.hardwareConcurrency?.toString() || '');
    parts.push(navigator.deviceMemory?.toString() || '');
    if (navigator.maxTouchPoints !== undefined) parts.push(String(navigator.maxTouchPoints));

    const hash = (typeof crypto !== 'undefined' && crypto.subtle)
      ? this.hashAsync(JSON.stringify(parts))
      : this.hashSync(JSON.stringify(parts));
    return hash;
  }

  private static hashAsync(s: string): string {
    // crypto.subtle is async; return a partial promise-based marker. For sync fingerprint we
    // fallback below; this is only called when crypto.subtle exists, but we keep generation sync.
    return this.hashSync(s);
  }

  private static hashSync(str: string): string {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return 'fp_' + (h >>> 0).toString(36);
  }

  static sessionId(): string {
    if (typeof window === 'undefined') return 'server';
    try {
      const existing = sessionStorage.getItem(STORAGE_KEY);
      if (existing) return existing;
      const id = 'sess_' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36));
      sessionStorage.setItem(STORAGE_KEY, id);
      return id;
    } catch {
      return 'sess_' + Date.now().toString(36);
    }
  }

  static getStoredFingerprint(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(FP_KEY);
    } catch {
      return null;
    }
  }

  static ensureFingerprint(self: { fingerprint: string }): void {
    if (typeof window === 'undefined') return;
    if (!Fingerprint.getStoredFingerprint()) {
      try { sessionStorage.setItem(FP_KEY, self.fingerprint); } catch {}
    }
  }
}
