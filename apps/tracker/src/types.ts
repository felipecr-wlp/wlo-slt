export interface SLConfig {
  endpoint: string;
  siteId: string;
  debug?: boolean;
  autoTrackForms?: boolean;
  autoTrackClicks?: boolean;
  autoTrackScroll?: boolean;
  respectDNT?: boolean;
}

export interface SessionData {
  sessionId: string;
  fingerprint: string;
  startedAt: number;
  pageCount: number;
  lastUrl: string;
  lastSeen: number;
}
