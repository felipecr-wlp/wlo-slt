import { initPageviewTracker } from './trackers/pageview';
import { initFormTracker } from './trackers/formSubmit';
import { initClickTracker } from './trackers/clickTracker';
import { initScrollTracker } from './trackers/scrollDepth';
import { initSession, Fingerprint } from './trackers/session';
import { EventQueue } from './utils/queue';
import { getConfig } from './utils/config';
import type { SLConfig } from './types';

interface TrackerConfig {
  endpoint: string;
  siteId: string;
  debug?: boolean;
  autoTrackForms?: boolean;
  autoTrackClicks?: boolean;
  autoTrackScroll?: boolean;
  respectDNT?: boolean;
}

class SLTracker {
  private config: TrackerConfig;
  private queue: EventQueue;
  fingerprint: string;
  sessionId: string;
  private isInitialized = false;

  constructor(config: TrackerConfig) {
    this.config = config;
    this.queue = new EventQueue(config.endpoint, config.siteId);
    this.fingerprint = Fingerprint.generate();
    this.sessionId = Fingerprint.sessionId();
  }

  init() {
    if (this.isInitialized) return;
    if (this.config.respectDNT && navigator.doNotTrack === '1') return;

    initSession(this);
    initPageviewTracker(this);
    if (this.config.autoTrackForms !== false) initFormTracker(this);
    if (this.config.autoTrackClicks !== false) initClickTracker(this);
    if (this.config.autoTrackScroll !== false) initScrollTracker(this);

    this.isInitialized = true;
    this.log('SLT Tracker initialized', { siteId: this.config.siteId });
  }

  track(event: Omit<Record<string, unknown>, 'site_id' | 'fingerprint' | 'session_id' | 'timestamp'>) {
    const fullEvent = {
      ...event,
      site_id: this.config.siteId,
      fingerprint: this.fingerprint,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
    };
    this.queue.push(fullEvent);
  }

  formSubmit(formId: string, data: Record<string, unknown>) {
    this.track({ type: 'form_submit', element_id: formId, payload: data });
  }

  customEvent(name: string, payload: Record<string, unknown>) {
    this.track({ type: 'custom', event_name: name, payload });
  }

  private log(...args: unknown[]) {
    if (this.config.debug) console.log('[SLT]', ...args);
  }
}

if (typeof window !== 'undefined') {
  const script = document.currentScript as HTMLScriptElement | null;
  if (script?.dataset.autoInit !== 'false') {
    const config: TrackerConfig = getConfig(script) as TrackerConfig;
    const tracker = new SLTracker(config);
    tracker.init();
    (window as any).SLT = tracker;
  }
}

export { SLTracker, type TrackerConfig, type SLConfig };
