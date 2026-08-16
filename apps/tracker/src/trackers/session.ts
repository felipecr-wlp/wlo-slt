import { Fingerprint } from './fingerprint';
import { sendBeacon, fallbackSend } from '../utils/beacon';

export interface TrackerLike {
  config: { endpoint: string; siteId: string };
  fingerprint: string;
  sessionId: string;
  track: (event: Record<string, unknown>) => void;
}

export function initSession(tracker: TrackerLike) {
  Fingerprint.ensureFingerprint(tracker);

  if (typeof window === 'undefined') return;
  const start = Date.now();
  let pages = 1;
  try {
    pages = Number(sessionStorage.getItem('__slt_pages') || '1') + 0;
    sessionStorage.setItem('__slt_pages', String(pages + 1));
  } catch {}

  tracker.track({
    type: 'session_start',
    payload: {
      pages,
      duration_ms: 0,
      referrer: document.referrer,
      url: window.location.href,
    },
  });

  window.addEventListener('beforeunload', () => {
    sendBeacon(tracker.config.endpoint, {
      type: 'session_end',
      site_id: tracker.config.siteId,
      session_id: tracker.sessionId,
      fingerprint: tracker.fingerprint,
      url: window.location.href,
      payload: { duration_ms: Date.now() - start },
      timestamp: new Date().toISOString(),
    });
    fallbackSend(tracker.config.endpoint, {});
  });
}

export { Fingerprint };
