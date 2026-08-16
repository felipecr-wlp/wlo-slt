import type { SLConfig } from '../types';

export function getConfig(script: HTMLScriptElement | null): SLConfig {
  const fallback: SLConfig = {
    endpoint: 'https://wlo-slt.vercel.app/api/ingest',
    siteId: 'default',
  };
  if (!script) return fallback;
  return {
    endpoint: script.dataset.endpoint || fallback.endpoint,
    siteId: script.dataset.siteId || fallback.siteId,
    debug: script.dataset.debug === 'true',
    autoTrackForms: script.dataset.forms !== 'false',
    autoTrackClicks: script.dataset.clicks !== 'false',
    autoTrackScroll: script.dataset.scroll !== 'false',
    respectDNT: script.dataset.dnt !== 'false',
  };
}
