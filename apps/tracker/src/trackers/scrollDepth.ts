import type { TrackerLike } from './session';

export function initScrollTracker(tracker: TrackerLike) {
  if (typeof window === 'undefined') return;

  let reached: Record<number, boolean> = {};
  const thresholds = [25, 50, 75, 100];

  function check() {
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    const winHeight = window.innerHeight;
    const scrollable = docHeight - winHeight;
    const scrolled = window.scrollY;
    const pct = scrollable <= 0 ? 100 : Math.round((scrolled / scrollable) * 100);
    for (const t of thresholds) {
      if (pct >= t && !reached[t]) {
        reached[t] = true;
        tracker.track({
          type: 'scroll',
          element_id: `scroll_${t}`,
          url: window.location.href,
          payload: { depth_pct: t },
        });
      }
    }
  }

  window.addEventListener('scroll', check, { passive: true });
  setTimeout(check, 1000);
}
