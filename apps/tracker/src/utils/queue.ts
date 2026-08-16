import { sendBeacon, fallbackSend } from './beacon';

export class EventQueue {
  private endpoint: string;
  private siteId: string;
  private buffer: unknown[] = [];
  private isFlushing = false;
  private readonly MAX = 50;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(endpoint: string, siteId: string) {
    this.endpoint = endpoint;
    this.siteId = siteId;
    if (typeof window !== 'undefined') {
      this.timer = setInterval(() => this.flush(), 5000);
      window.addEventListener('beforeunload', () => this.flush(true));
    }
  }

  push(event: unknown) {
    this.buffer.push(event);
    if (this.buffer.length >= this.MAX) this.flush();
  }

  async flush(beacon = false) {
    if (this.isFlushing || this.buffer.length === 0) return;
    this.isFlushing = true;
    const payload = this.buffer.splice(0, this.buffer.length);
    try {
      const ok = beacon ? sendBeacon(this.endpoint, payload) : false;
      if (!ok) await fallbackSend(this.endpoint, payload);
    } catch {
      this.buffer.unshift(...payload);
    } finally {
      this.isFlushing = false;
    }
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}
