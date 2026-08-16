import type { TrackerLike } from './session';

export function initPageviewTracker(tracker: TrackerLike) {
  if (typeof window === 'undefined') return;

  function capture() {
    const url = window.location.href;
    const referrer = document.referrer;
    const utm = getUtm();
    tracker.track({
      type: 'pageview',
      url,
      referrer,
      ...utm,
      payload: {
        device_type: getDeviceType(),
        screen_res: `${screen.width}x${screen.height}`,
        cores: navigator.hardwareConcurrency,
        memory_gb: (navigator as any).deviceMemory,
        connection_type: (navigator as any).connection?.effectiveType,
      },
    });
  }

  capture();

  let lastPath = window.location.pathname + window.location.search;
  const observer = new MutationObserver(() => {});
  const origPush = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);
  history.pushState = function (...args: any[]) {
    origPush(...args);
    if (window.location.pathname + window.location.search !== lastPath) {
      lastPath = window.location.pathname + window.location.search;
      capture();
    }
  };
  history.replaceState = function (...args: any[]) {
    origReplace(...args);
  };
  window.addEventListener('popstate', () => {
    if (window.location.pathname + window.location.search !== lastPath) {
      lastPath = window.location.pathname + window.location.search;
      capture();
    }
  });
  observer.disconnect();
}

function getUtm() {
  const p = new URLSearchParams(window.location.search);
  const o: Record<string, string> = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid']) {
    const v = p.get(k);
    if (v) o[k] = v;
  }
  return o;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}
