import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { checkApiKey } from '@/lib/apiKeys';
import { z } from 'zod';

const SLT_KEY = process.env.SLT_WEBHOOK_KEY || '';

// ── Schemas ──────────────────────────────────────────────────────────────

const baseFields = {
  tipo: z.string().min(1),
  timestamp: z.string().nullable().optional(),
  session_id: z.string().nullable().optional(),
  fingerprint: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
};

const eventoSchema = z.object({
  ...baseFields,
  tipo: z.literal('evento'),
  url_pagina: z.string().nullable().optional(),
  elemento_id: z.string().nullable().optional(),
  user_name: z.string().nullable().optional(),
  user_email: z.string().nullable().optional(),
  user_phone: z.string().nullable().optional(),
  user_ip: z.string().nullable().optional(),
  user_profile: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
  persona: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  utm_content: z.string().nullable().optional(),
  utm_term: z.string().nullable().optional(),
  gclid: z.string().nullable().optional(),
  fbclid: z.string().nullable().optional(),
}).passthrough();

const redirectSchema = z.object({
  ...baseFields,
  tipo: z.literal('redirect'),
  slug: z.string().nullable().optional(),
  campana: z.string().nullable().optional(),
  plataforma: z.string().nullable().optional(),
  destino: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  ip: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  referer: z.string().nullable().optional(),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  session_id: z.string().nullable().optional(),
  fingerprint: z.string().nullable().optional(),
}).passthrough();

const webhookSchema = z.object({
  ...baseFields,
  tipo: z.literal('webhook'),
  payload: z.record(z.unknown()).nullable().default({}),
  source: z.string().nullable().default('pipedrive'),
  status: z.string().nullable().default('pending'),
  linked_session_id: z.string().nullable().optional(),
}).passthrough();

const testSchema = z.object({
  tipo: z.literal('test_connection'),
}).passthrough();

// ── CORS headers ─────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type, x-slt-key',
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

// ── Auth ─────────────────────────────────────────────────────────────────

async function checkAuth(req: Request): Promise<string | null> {
  const provided = req.headers.get('x-slt-key') || '';
  if (!provided) return 'x-slt-key faltante';

  // Intentar contra DB
  const dbValid = await checkApiKey(provided);
  if (dbValid) return null;

  // Fallback a env var
  if (SLT_KEY && provided === SLT_KEY) return null;

  return 'x-slt-key inválido';
}

// ── Handlers ─────────────────────────────────────────────────────────────

function toUUID(value: string | null | undefined): string {
  if (value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return value;
  }
  return crypto.randomUUID?.() || '00000000-0000-0000-0000-000000000000';
}

async function handleEvento(data: z.infer<typeof eventoSchema>) {
  const client = getSupabaseAdmin();
  if (!client) throw new Error('Supabase no configurado');

  const sessionId = toUUID(data.session_id);
  const ts = data.timestamp || new Date().toISOString();

  const { error } = await client.from('events').insert({
    session_id: sessionId,
    event_type: 'wordpress_evento',
    element_id: data.elemento_id || null,
    url: data.url_pagina || 'unknown',
    fingerprint: data.fingerprint || null,
    utm_source: data.utm_source || null,
    utm_medium: data.utm_medium || null,
    utm_campaign: data.utm_campaign || null,
    utm_content: data.utm_content || null,
    utm_term: data.utm_term || null,
    gclid: data.gclid || null,
    fbclid: data.fbclid || null,
    country: data.location || null,
    payload: {
      user_name: data.user_name || null,
      user_email: data.user_email || null,
      user_phone: data.user_phone || null,
      user_ip: data.user_ip || null,
      user_profile: data.user_profile || null,
      observaciones: data.observaciones || null,
      score: data.score ?? null,
      persona: data.persona || null,
      source: data.source || 'simple_lead_tracker',
      version: data.version || null,
      raw_session_id: data.session_id || null,
    },
    created_at: ts,
  });
  if (error) {
    await client.from('integration_logs').insert({
      integration: 'slt',
      status: 'error',
      request_payload: { tipo: 'evento', error: error.message, user_email: data.user_email } as any,
      error_message: error.message,
    }).catch(() => {});
    throw error;
  }

  await client.from('integration_logs').insert({
    integration: 'slt',
    status: 'success',
    request_payload: { tipo: 'evento', user_email: data.user_email, user_name: data.user_name, url_pagina: data.url_pagina, score: data.score } as any,
  }).catch(() => {});

  return { ok: true, session_id: sessionId, event_type: 'wordpress_evento' };
}

async function handleRedirect(data: z.infer<typeof redirectSchema>) {
  const client = getSupabaseAdmin();
  if (!client) throw new Error('Supabase no configurado');

  // Buscar el short_link por slug para obtener el link_id
  let linkId: string | null = null;
  if (data.slug) {
    const { data: link } = await client
      .from('short_links')
      .select('id')
      .eq('slug', data.slug)
      .single();
    linkId = link?.id || null;
  }

  // Si no existe el slug, crear el short_link automáticamente
  if (!linkId && data.slug) {
    const { data: newLink } = await client
      .from('short_links')
      .insert({
        id: data.slug,
        name: data.campana || data.slug,
        slug: data.slug,
        target_url: data.destino || '',
        plataforma: data.plataforma || 'General',
      })
      .select('id')
      .single();
    linkId = newLink?.id || null;
  }

  if (linkId) {
    const { error } = await client.from('redirect_clicks').insert({
      link_id: linkId,
      session_id: data.session_id || null,
      fingerprint: data.fingerprint || null,
      ip_hash: data.ip || null,
      referrer: data.referer || null,
      utm_source: data.utm_source || null,
      utm_medium: data.utm_medium || null,
      utm_campaign: data.utm_campaign || null,
      user_agent: data.user_agent || null,
    });
    if (error) throw error;

    // Incrementar contador de clicks
    await client.rpc('increment_clicks' as any, { link_id_param: linkId }).catch(() => {
      client.from('short_links').select('clicks').eq('id', linkId).single().then(({ data: link }: { data: { clicks: number } | null }) => {
        if (link) {
          client.from('short_links').update({ clicks: (link.clicks || 0) + 1 }).eq('id', linkId);
        }
      });
    });
  }

  await client.from('integration_logs').insert({
    integration: 'slt',
    status: 'success',
    request_payload: { tipo: 'redirect', slug: data.slug, destino: data.destino, email: data.email } as any,
  }).catch(() => {});

  return { ok: true, slug: data.slug, link_id: linkId };
}

async function handleWebhook(data: z.infer<typeof webhookSchema>) {
  const client = getSupabaseAdmin();
  if (!client) throw new Error('Supabase no configurado');

  const { error } = await client.from('integration_logs').insert({
    integration: data.source || 'wordpress_webhook',
    status: data.status || 'pending',
    request_payload: data.payload || {},
  });
  if (error) throw error;

  return { ok: true, source: data.source };
}

// ── Route ────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const authError = await checkAuth(req);
  if (authError) return jsonRes({ error: authError }, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonRes({ error: 'Invalid JSON' }, 400);
  }

  const tipo = (body as any)?.tipo;

  try {
    switch (tipo) {
      case 'evento': {
        const parsed = eventoSchema.safeParse(body);
        if (!parsed.success) return jsonRes({ error: 'Validation error', details: parsed.error.flatten() }, 400);
        const result = await handleEvento(parsed.data);
        return jsonRes(result);
      }
      case 'redirect': {
        const parsed = redirectSchema.safeParse(body);
        if (!parsed.success) return jsonRes({ error: 'Validation error', details: parsed.error.flatten() }, 400);
        const result = await handleRedirect(parsed.data);
        return jsonRes(result);
      }
      case 'webhook': {
        const parsed = webhookSchema.safeParse(body);
        if (!parsed.success) return jsonRes({ error: 'Validation error', details: parsed.error.flatten() }, 400);
        const result = await handleWebhook(parsed.data);
        return jsonRes(result);
      }
      case 'test_connection': {
        return jsonRes({ ok: true, message: 'Conexión exitosa con wlo-slt', timestamp: new Date().toISOString() });
      }
      default:
        return jsonRes({ error: `Tipo desconocido: ${tipo}. Tipos válidos: evento, redirect, webhook, test_connection` }, 400);
    }
  } catch (e: any) {
    return jsonRes({ error: e?.message || 'Error interno del servidor' }, 500);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return jsonRes({
    endpoint: '/api/webhooks/slt',
    method: 'POST',
    auth: 'x-slt-key header',
    env_var: 'SLT_WEBHOOK_KEY',
    tipos: {
      evento: 'Tracking de eventos del plugin (pageview, form_submit, click, etc.)',
      redirect: 'Clicks en enlaces cortos / redirects',
      webhook: 'Webhooks de CRM (Pipedrive, ClickUp, etc.)',
      test_connection: 'Prueba de conexión desde el plugin',
    },
    payload_evento: {
      tipo: 'evento',
      timestamp: '2026-08-20 14:30:00',
      session_id: 'Sacramento, California | US | IP:73.158.42.110',
      url_pagina: 'https://welovepaving.com/em/priority-assessment/',
      elemento_id: 'Entrada',
      user_name: 'Juan Pérez',
      user_email: 'juan@ejemplo.com',
      user_ip: '73.158.42.110',
      fingerprint: 'FP-28473619',
      user_profile: 'standard_web',
      observaciones: 'Ubicacion: Sacramento, California, US',
      score: 25,
      persona: 'Visitante Casual',
      location: 'Sacramento, California, US',
    },
    payload_redirect: {
      tipo: 'redirect',
      slug: 'demo',
      campana: 'Verano 2026',
      plataforma: 'Google Ads',
      destino: 'https://welovepaving.com/contacto',
      email: 'juan@ejemplo.com',
      ip: '73.158.42.110',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'verano',
    },
    payload_webhook: {
      tipo: 'webhook',
      source: 'pipedrive',
      payload: { action: 'added', object: 'person', name: 'Juan Perez' },
      status: 'pending',
    },
  });
}
