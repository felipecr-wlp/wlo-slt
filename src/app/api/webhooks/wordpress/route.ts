import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { z } from 'zod';

const WP_KEY = process.env.WORDPRESS_WEBHOOK_KEY || '';

const wpPayloadSchema = z.object({
  event: z.string().min(1).nullable().default('form_submit'),
  form_id: z.string().nullable().optional(),
  page_url: z.string().url().nullable().optional(),
  referrer: z.string().nullable().optional(),
  fields: z.record(z.unknown()).nullable().default({}),
  utm: z.object({
    utm_source: z.string().nullable().optional(),
    utm_medium: z.string().nullable().optional(),
    utm_campaign: z.string().nullable().optional(),
    utm_content: z.string().nullable().optional(),
    utm_term: z.string().nullable().optional(),
  }).nullable().default({}),
  click_ids: z.object({
    gclid: z.string().nullable().optional(),
    fbclid: z.string().nullable().optional(),
    msclkid: z.string().nullable().optional(),
    li_fat_id: z.string().nullable().optional(),
    ttclid: z.string().nullable().optional(),
  }).nullable().default({}),
  technical: z.object({
    browser: z.string().nullable().optional(),
    os: z.string().nullable().optional(),
    device_type: z.enum(['desktop', 'mobile', 'tablet']).nullable().optional(),
    screen_res: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
  }).nullable().default({}),
  site_id: z.string().nullable().optional(),
  session_id: z.string().nullable().optional(),
  fingerprint: z.string().nullable().optional(),
  timestamp: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-WP-KEY',
  };

  // Auth check
  if (WP_KEY) {
    const provided = req.headers.get('x-wp-key') || '';
    if (provided !== WP_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized', message: 'X-WP-KEY inválido o faltante' }), {
        status: 401,
        headers,
      });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
  }

  const parsed = wpPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation error', details: parsed.error.flatten() }), {
      status: 400,
      headers,
    });
  }

  const data = parsed.data;
  const client = getSupabaseAdmin();

  if (!client) {
    return new Response(JSON.stringify({ error: 'Supabase no configurado en el servidor' }), { status: 500, headers });
  }

  const sessionId = data.session_id || `wp-${crypto.randomUUID?.() || Date.now()}`;
  const fingerprint = data.fingerprint || `wp-${data.site_id || 'default'}`;
  const ts = data.timestamp || new Date().toISOString();
  const utm = data.utm || {};
  const clicks = data.click_ids || {};
  const tech = data.technical || {};

  try {
    const { error } = await client.from('events').insert({
      session_id: sessionId,
      event_type: data.event,
      element_id: data.form_id || null,
      url: data.page_url || 'https://wordpress.webhook',
      referrer: data.referrer || null,
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_content: utm.utm_content || null,
      utm_term: utm.utm_term || null,
      gclid: clicks.gclid || null,
      fbclid: clicks.fbclid || null,
      fingerprint,
      country: tech.country || null,
      city: tech.city || null,
      device_type: tech.device_type || null,
      browser: tech.browser || null,
      os: tech.os || null,
      screen_res: tech.screen_res || null,
      payload: { fields: data.fields || {}, source: 'wordpress', ...utm, ...clicks },
      created_at: ts,
    });
    if (error) throw error;

    await client.from('integration_logs').insert({
      integration: 'wordpress',
      status: 'success',
      request_payload: data as any,
    });

    return new Response(JSON.stringify({ ok: true, session_id: sessionId, event_type: data.event }), {
      status: 200,
      headers,
    });
  } catch (e: any) {
    await client.from('integration_logs').insert({
      integration: 'wordpress',
      status: 'error',
      error_message: e?.message,
      request_payload: data as any,
    }).catch(() => {});

    return new Response(JSON.stringify({ error: e?.message || 'Error al guardar en Supabase' }), {
      status: 500,
      headers,
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-WP-KEY',
    },
  });
}

export async function GET() {
  return Response.json({
    endpoint: '/api/webhooks/wordpress',
    method: 'POST',
    auth: 'X-WP-KEY header',
    env_var: 'WORDPRESS_WEBHOOK_KEY',
    payload: {
      event: 'form_submit',
      form_id: 'optional_form_id',
      page_url: 'https://tu-sitio.com/contacto',
      referrer: 'https://google.com/',
      fields: { name: 'John', email: 'john@example.com', phone: '+123' },
      utm: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'verano' },
      click_ids: { gclid: '...', fbclid: '...' },
      technical: { browser: 'Chrome', os: 'Windows', device_type: 'desktop' },
    },
  });
}
