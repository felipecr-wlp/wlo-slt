// Buffer en memoria para el demo (sin DB). Los eventos recibidos por /api/ingest
// se guardan aquí y se exponen vía /api/dashboard/realtime (SSE) y /api/dashboard/events.
import type { TrackEvent } from '@slt/shared-types';

export interface BufferedEvent extends TrackEvent {
  id: string;
}

const buffer: BufferedEvent[] = [];
const listeners: Array<(e: BufferedEvent) => void> = [];

export function addEvent(event: Omit<BufferedEvent, 'id'>): BufferedEvent {
  const e: BufferedEvent = { id: crypto.randomUUID?.() ?? Math.random().toString(36), ...event };
  buffer.unshift(e);
  if (buffer.length > 200) buffer.pop();
  for (const l of listeners) l(e);
  return e;
}

export function getRecentEvents(limit = 50): BufferedEvent[] {
  return buffer.slice(0, limit);
}

export function clearEvents(): number {
  const n = buffer.length;
  buffer.length = 0;
  return n;
}

export function setEvents(events: BufferedEvent[]): void {
  buffer.length = 0;
  buffer.push(...events);
}

export function searchEvents(filter: { url?: string; type?: string; limit?: number }): BufferedEvent[] {
  const limit = filter.limit ?? 50;
  return buffer
    .filter((e) => {
      if (filter.url && !(e.url || '').toLowerCase().includes(filter.url!.toLowerCase())) return false;
      if (filter.type && e.type !== filter.type) return false;
      return true;
    })
    .slice(0, limit);
}

export function listen(cb: (e: BufferedEvent) => void): () => void {
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}
