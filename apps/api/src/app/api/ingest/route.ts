import type { TrackEvent } from '@slt/shared-types';
import { trackEventSchema } from '@/lib/validators';

function normalize(body: unknown): TrackEvent[] {
  if (Array.isArray(body)) return body as TrackEvent[];
  return [body as TrackEvent];
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const commonHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(origin
      ? {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Fingerprint',
        }
      : {}),
  };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: commonHeaders });
  }

  const events = normalize(body);
  const results: Array<{ ok: boolean; error?: string }> = [];

  for (const ev of events) {
    const parsed = trackEventSchema.safeParse(ev);
    if (!parsed.success) {
      results.push({ ok: false, error: 'validation error' });
      continue;
    }
    const event = parsed.data;
    storeEvent(event, req).catch(() => {});
    results.push({ ok: true });
  }

  return new Response(JSON.stringify({ ok: true, received: events.length }), {
    status: 200,
    headers: commonHeaders,
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Fingerprint',
    },
  });
}

async function storeEvent(event: TrackEvent, req: Request) {
  const { getSupabaseAdmin } = await import('@/lib/supabase-admin');
  const { addEvent } = await import('@/lib/ingestBuffer');

  const client = getSupabaseAdmin();

  if (client) {
    const ipHash = await hashIP(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown');
    try {
      await client.from('events').insert({
        session_id: event.session_id,
        event_type: event.type,
        element_id: event.element_id,
        url: event.url,
        referrer: event.referrer,
        utm_source: event.utm_source,
        utm_medium: event.utm_medium,
        utm_campaign: event.utm_campaign,
        utm_content: event.utm_content,
        utm_term: event.utm_term,
        gclid: event.gclid,
        fbclid: event.fbclid,
        user_agent: event.browser,
        fingerprint: event.fingerprint,
        ip_hash: ipHash,
        country: req.headers.get('x-vercel-ip-country') || 'unknown',
        city: req.headers.get('x-vercel-ip-city') || 'unknown',
        device_type: event.device_type,
        browser: event.browser,
        os: event.os,
        screen_res: event.screen_res,
        cores: event.cores,
        memory_gb: event.memory_gb,
        connection_type: event.connection_type,
        payload: event.payload,
      });
      await client
        .from('sessions')
        .upsert({ fingerprint: event.fingerprint, last_seen: new Date().toISOString() }, { onConflict: 'fingerprint' });
    } catch {
      addEvent({ ...event });
    }
  } else {
    addEvent({ ...event });
  }
}

async function hashIP(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT || 'default-salt';
  const data = new TextEncoder().encode(ip + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
