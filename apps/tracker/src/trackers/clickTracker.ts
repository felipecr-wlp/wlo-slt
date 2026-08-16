import type { TrackerLike } from './session';

export function initClickTracker(tracker: TrackerLike) {
  if (typeof document === 'undefined') return;

  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tracked = target.closest('[data-slt-track]') as HTMLElement | null;
      if (!tracked) return;
      const eventId = tracked.id || tracked.getAttribute('data-slt-track') || tracked.tagName;
      tracker.track({
        type: 'click',
        element_id: eventId,
        url: window.location.href,
        payload: {
          text: tracked.textContent?.slice(0, 100),
          tag: tracked.tagName,
        },
      });
    },
    true
  );
}
