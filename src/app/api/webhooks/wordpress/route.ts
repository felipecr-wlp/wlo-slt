import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { z } from 'zod';

const WP_KEY = process.env.WORDPRESS_WEBHOOK_KEY || '';

// Schema unificado: acepta formato WP SLT PRO (url_pagina, user_name, etc.)
// Y formato genérico (page_url, fields, etc.) que ya existía.
const wpPayloadSchema = z.object({
  // Evento
  event: z.string().min(1).nullable().default('pageview'),
  form_id: z.string().nullable().optional(),
  elemento_id: z.string().nullable().optional(),

  // URL — WP usa url_pagina, genérico usa page_url
  url_pagina: z.string().nullable().optional(),
  page_url: z.string().nullable().optional(),

  // Datos de usuario — WP los manda planos
  user_name: z.string().nullable().optional(),
  user_email: z.string().nullable().optional(),
  user_phone: z.string().nullable().optional(),
  user_ip: z.string().nullable().optional(),
  user_profile: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),

  // Campos genéricos (formato anterior)
  fields: z.record(z.unknown()).nullable().default({}),

  // Referrer
  referer: z.string().nullable().optional(),
  referrer: z.string().nullable().optional(),

  // UTM — WP puede enviarlos como parte del body o como campos sueltos
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  utm_content: z.string().nullable().optional(),
  utm_term: z.string().nullable().optional(),
  utm: z.object({
    utm_source: z.string().nullable().optional(),
    utm_medium: z.string().nullable().optional(),
    utm_campaign: z.string().nullable().optional(),
    utm_content: z.string().nullable().optional(),
    utm_term: z.string().nullable().optional(),
  }).nullable().default({}),

  // Click IDs — WP puede enviarlos planos o en objeto
  gclid: z.string().nullable().optional(),
  fbclid: z.string().nullable().optional(),
  msclkid: z.string().nullable().optional(),
  click_ids: z.object({
    gclid: z.string().nullable().optional(),
    fbclid: z.string().nullable().optional(),
    msclkid: z.string().nullable().optional(),
    li_fat_id: z.string().nullable().optional(),
    ttclid: z.string().nullable().optional(),
  }).nullable().default({}),

  // Técnico
  browser: z.string().nullable().optional(),
  os: z.string().nullable().optional(),
  device_type: z.enum(['desktop', 'mobile', 'tablet']).nullable().optional(),
  screen_res: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  technical: z.object({
    browser: z.string().nullable().optional(),
    os: z.string().nullable().optional(),
    device_type: z.enum(['desktop', 'mobile', 'tablet']).nullable().optional(),
    screen_res: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
  }).nullable().default({}),

  // Identidad
  site_id: z.string().nullable().optional(),
  session_id: z.string().nullable().optional(),
  fingerprint: z.string().nullable().optional(),
  timestamp: z.string().nullable().optional(),
  fecha: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-WP-KEY',
  };

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

  const d = parsed.data;
  const client = getSupabaseAdmin();

  if (!client) {
    return new Response(JSON.stringify({ error: 'Supabase no configurado en el servidor' }), { status: 500, headers });
  }

  // Normalizar: URL (wp usa url_pagina, genérico usa page_url)
  const url = d.url_pagina || d.page_url || null;
  const referrer = d.referer || d.referrer || null;

  // Normalizar: UTM (pueden venir planos o en objeto)
  const utm = d.utm || {};
  const utmSource = d.utm_source || utm.utm_source || null;
  const utmMedium = d.utm_medium || utm.utm_medium || null;
  const utmCampaign = d.utm_campaign || utm.utm_campaign || null;
  const utmContent = d.utm_content || utm.utm_content || null;
  const utmTerm = d.utm_term || utm.utm_term || null;

  // Normalizar: Click IDs (pueden venir planos o en objeto)
  const clicks = d.click_ids || {};
  const gclid = d.gclid || clicks.gclid || null;
  const fbclid = d.fbclid || clicks.fbclid || null;

  // Normalizar: Técnico (pueden venir planos o en objeto)
  const tech = d.technical || {};
  const browser = d.browser || tech.browser || null;
  const os = d.os || tech.os || null;
  const deviceType = d.device_type || tech.device_type || null;
  const screenRes = d.screen_res || tech.screen_res || null;
  const country = d.country || tech.country || null;
  const city = d.city || tech.city || null;

  // Normalizar: campos de usuario (WP los manda planos)
  const fields: Record<string, unknown> = { ...(d.fields || {}) };
  if (d.user_name && !fields.name) fields.name = d.user_name;
  if (d.user_email && !fields.email) fields.email = d.user_email;
  if (d.user_phone && !fields.phone) fields.phone = d.user_phone;
  if (d.user_profile) fields.user_profile = d.user_profile;
  if (d.observaciones) fields.observations = d.observaciones;

  // Session ID
  const sessionId = d.session_id || `wp-${crypto.randomUUID?.() || Date.now()}`;
  const fingerprint = d.fingerprint || `wp-${d.site_id || 'default'}`;

  // Timestamp — WP usa 'fecha'
  const ts = d.timestamp || d.fecha || new Date().toISOString();

  // Event type — mapear elemento_id a event si viene vacío
  const eventType = d.event || (d.form_id ? 'form_submit' : 'pageview');

  // Element ID — WP usa elemento_id
  const elementId = d.elemento_id || d.form_id || null;

  try {
    const { error } = await client.from('events').insert({
      session_id: sessionId,
      event_type: eventType,
      element_id: elementId,
      url: url || 'https://wordpress.webhook',
      referrer,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      utm_term: utmTerm,
      gclid,
      fbclid,
      fingerprint,
      country,
      city,
      device_type: deviceType,
      browser,
      os,
      screen_res: screenRes,
      payload: { fields, source: 'wordpress', user_ip: d.user_ip || null },
      created_at: ts,
    });
    if (error) throw error;

    await client.from('integration_logs').insert({
      integration: 'wordpress',
      status: 'success',
      request_payload: { ...d, _normalized: { url, fields, eventType } } as any,
    });

    return new Response(JSON.stringify({ ok: true, session_id: sessionId, event_type: eventType }), {
      status: 200,
      headers,
    });
  } catch (e: any) {
    await client.from('integration_logs').insert({
      integration: 'wordpress',
      status: 'error',
      error_message: e?.message,
      request_payload: d as any,
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
    formats: {
      wp_slt_pro: {
        description: 'Formato del plugin WordPress Simple Lead Tracker PRO',
        example: {
          event: 'form_submit',
          url_pagina: 'https://welovepaving.invify.online/contacto',
          user_name: 'Juan Pérez',
          user_email: 'juan@ejemplo.com',
          user_phone: '+52 55 1234 5678',
          session_id: 'CDMX | CDMX | IP:189.203.100.50',
          fingerprint: 'abc123',
          elemento_id: 'form_contacto',
          observaciones: 'Lead desde formulario de contacto',
        },
      },
      generico: {
        description: 'Formato genérico con fields anidados',
        example: {
          event: 'form_submit',
          page_url: 'https://tusitio.com/contacto',
          fields: { name: 'Juan', email: 'juan@ejemplo.com' },
          utm: { utm_source: 'google', utm_medium: 'cpc' },
        },
      },
    },
  });
}
