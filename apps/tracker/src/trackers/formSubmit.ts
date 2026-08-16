import type { TrackerLike } from './session';

export function initFormTracker(tracker: TrackerLike) {
  if (typeof document === 'undefined') return;

  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement | null;
    if (!form || form.tagName !== 'FORM') return;
    const formId = form.id || form.getAttribute('data-slt-form') || form.name || 'unknown';
    const data: Record<string, unknown> = {};
    new FormData(form).forEach((v, k) => {
      data[k] = v;
    });

    // Allow cross-origin send (form may be on another domain). Use beacon + fallback.
    const payload = {
      site_id: tracker.config.siteId,
      session_id: tracker.sessionId,
      fingerprint: tracker.fingerprint,
      type: 'form_submit' as const,
      element_id: formId,
      url: window.location.href,
      referrer: document.referrer,
      payload: data,
      timestamp: new Date().toISOString(),
    };

    const ok = navigator.sendBeacon
      ? navigator.sendBeacon(tracker.config.endpoint, new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      : false;
    if (!ok) {
      fetch(tracker.config.endpoint, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  }, true);
}
