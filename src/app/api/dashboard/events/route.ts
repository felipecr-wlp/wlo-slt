import { getEvents } from '@/lib/data';
import { getRecentEvents } from '@/lib/ingestBuffer';

const noCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') || '50');
  const events = await getEvents(limit);
  const live = getRecentEvents(limit).map((e) => ({
    id: e.id,
    session_id: e.session_id,
    event_type: e.type,
    element_id: e.element_id,
    url: e.url,
    referrer: e.referrer || null,
    country: e.country || null,
    device_type: e.device_type || null,
    created_at: e.timestamp || new Date().toISOString(),
  }));
  const combined = [...live, ...events].slice(0, limit);
  return Response.json(combined, { headers: noCache });
}
