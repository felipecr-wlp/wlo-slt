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

function eventoRow(data: Record<string, unknown>, ts?: string) {
  const d = data as any;
  return {
    session_id: toUUID(d.session_id),
    event_type: d.event_type || 'wordpress_evento',
    element_id: d.elemento_id || d.element_id || null,
    url: d.url_pagina || d.url || 'unknown',
    fingerprint: d.fingerprint || null,
    utm_source: d.utm_source || null,
    utm_medium: d.utm_medium || null,
    utm_campaign: d.utm_campaign || null,
    utm_content: d.utm_content || null,
    utm_term: d.utm_term || null,
    gclid: d.gclid || null,
    fbclid: d.fbclid || null,
    country: d.country || d.location || null,
    city: d.city || null,
    device_type: d.device_type || d.user_profile || null,
    browser: d.browser || null,
    os: d.os || null,
    user_agent: d.user_agent || null,
    ip_hash: d.user_ip || d.ip || null,
    referrer: d.referrer || d.referer || null,
    screen_res: d.screen_res || null,
    payload: {
      user_name: d.user_name || null,
      user_email: d.user_email || null,
      user_phone: d.user_phone || null,
      user_ip: d.user_ip || null,
      user_profile: d.user_profile || null,
      observaciones: d.observaciones || null,
      score: d.score ?? null,
      persona: d.persona || null,
      source: d.source || 'simple_lead_tracker',
      version: d.version || null,
      raw_session_id: d.session_id || null,
    },
    created_at: ts || d.timestamp || new Date().toISOString(),
  };
}

async function handleEvento(data: z.infer<typeof eventoSchema>) {
  const client = getSupabaseAdmin();
  if (!client) throw new Error('Supabase no configurado');

  const { error } = await client.from('events').insert(eventoRow(data as unknown as Record<string, unknown>, data.timestamp || undefined));
  if (error) {
    await client.from('integration_logs').insert({
      integration: 'slt',
      status: 'error',
      request_payload: { tipo: 'evento', saved: false, reason: error.message, code: error.code, table: 'events', user_email: data.user_email, user_name: data.user_name, url_pagina: data.url_pagina, session_id: data.session_id, site: extractSite(data) } as any,
      error_message: `${error.message} (${error.code || 'no-code'}) — tabla: events`,
    }).then(() => {}, () => {});
    throw error;
  }

  await client.from('integration_logs').insert({
    integration: 'slt',
    status: 'success',
    request_payload: { tipo: 'evento', saved: true, user_email: data.user_email, user_name: data.user_name, url_pagina: data.url_pagina, score: data.score, session_id: data.session_id, site: extractSite(data), observaciones: data.observaciones } as any,
  }).then(() => {}, () => {});

  return { ok: true };
}

function extractSite(body: any): string {
  try {
    const url = body?.url_pagina || body?.events?.[0]?.url_pagina || body?.redirects?.[0]?.destino || body?.payload?.url || '';
    if (url) return new URL(url).hostname;
  } catch {}
  return body?.site_id || body?.source || '-';
}

async function handleBulkEventos(body: any) {
  const client = getSupabaseAdmin();
  if (!client) throw new Error('Supabase no configurado');

  const events: any[] = body.events || [];
  const rows = events.map((e) => eventoRow(e));
  const { error, data: inserted } = await client.from('events').insert(rows).select('id');
  if (error) {
    await client.from('integration_logs').insert({
      integration: 'slt',
      status: 'error',
      request_payload: { tipo: 'bulk_eventos', saved: false, reason: error.message, code: error.code, table: 'events', total: rows.length, site: extractSite(body) } as any,
      error_message: `${error.message} (${error.code || 'no-code'}) — bulk de ${rows.length} eventos`,
    }).then(() => {}, () => {});
    throw error;
  }

  await client.from('integration_logs').insert({
    integration: 'slt',
    status: 'success',
    request_payload: { tipo: 'bulk_eventos', saved: true, count: inserted?.length || rows.length, site: extractSite(body) } as any,
  }).then(() => {}, () => {});

  return { ok: true, imported: inserted?.length || rows.length };
}

async function handleRedirect(data: z.infer<typeof redirectSchema>) {
  const client = getSupabaseAdmin();
  if (!client) throw new Error('Supabase no configurado');

  let linkId: string | null = null;
  if (data.slug) {
    const { data: link } = await client
      .from('short_links')
      .select('id')
      .eq('slug', data.slug)
      .single();
    linkId = link?.id || null;
  }

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
    if (error) {
      await client.from('integration_logs').insert({
        integration: 'slt',
        status: 'error',
        request_payload: { tipo: 'redirect', saved: false, reason: error.message, code: error.code, table: 'redirect_clicks', slug: data.slug, destino: data.destino, email: data.email } as any,
        error_message: `${error.message} (${error.code || 'no-code'}) — redirect_clicks, slug: ${data.slug}`,
      }).then(() => {}, () => {});
      throw error;
    }
  }

  await client.from('integration_logs').insert({
    integration: 'slt',
    status: 'success',
    request_payload: { tipo: 'redirect', saved: true, slug: data.slug, destino: data.destino, email: data.email, link_id: linkId } as any,
  }).then(() => {}, () => {});

  return { ok: true, slug: data.slug, link_id: linkId };
}

async function handleBulkRedirects(body: any) {
  const client = getSupabaseAdmin();
  if (!client) throw new Error('Supabase no configurado');

  const redirects: any[] = body.redirects || [];
  let imported = 0;

  for (const r of redirects) {
    const slug = r.slug || r.id;
    if (!slug) continue;

    let linkId: string | null = null;
    const { data: existing } = await client.from('short_links').select('id').eq('slug', slug).single();
    linkId = existing?.id || null;

    if (!linkId) {
      const { data: newLink } = await client
        .from('short_links')
        .insert({ id: slug, name: r.campana || slug, slug, target_url: r.destino || '', plataforma: r.plataforma || 'General' })
        .select('id')
        .single();
      linkId = newLink?.id || null;
    }

    if (linkId) {
      await client.from('redirect_clicks').insert({
        link_id: linkId,
        session_id: r.session_id || null,
        fingerprint: r.fingerprint || null,
        ip_hash: r.ip || null,
        referrer: r.referer || null,
        utm_source: r.utm_source || null,
        utm_medium: r.utm_medium || null,
        utm_campaign: r.utm_campaign || null,
        user_agent: r.user_agent || null,
      }).then(() => {}, () => {});
      imported++;
    }
  }

  await client.from('integration_logs').insert({
    integration: 'slt',
    status: 'success',
    request_payload: { tipo: 'bulk_redirects', saved: true, count: imported, total: redirects.length, skipped: redirects.length - imported, site: extractSite(body) } as any,
  }).then(() => {}, () => {});

  return { ok: true, imported };
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

async function handleBulkWebhooks(body: any) {
  const client = getSupabaseAdmin();
  if (!client) throw new Error('Supabase no configurado');

  const webhooks: any[] = body.webhooks || [];
  const rows = webhooks.map((w) => ({
    integration: w.source || 'wordpress_webhook',
    status: w.status || 'pending',
    request_payload: typeof w.payload === 'string' ? JSON.parse(w.payload || '{}') : (w.payload || {}),
  }));

  const { error } = await client.from('integration_logs').insert(rows);
  if (error) {
    await client.from('integration_logs').insert({
      integration: 'slt',
      status: 'error',
      request_payload: { tipo: 'bulk_webhooks', saved: false, reason: error.message, code: error.code, table: 'integration_logs', total: rows.length } as any,
      error_message: `${error.message} (${error.code || 'no-code'}) — bulk de ${rows.length} webhooks`,
    }).then(() => {}, () => {});
    throw error;
  }

  await client.from('integration_logs').insert({
    integration: 'slt',
    status: 'success',
    request_payload: { tipo: 'bulk_webhooks', saved: true, count: rows.length } as any,
  }).then(() => {}, () => {});

  return { ok: true, imported: rows.length };
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
    // ── WLi Tracking (sin campo "tipo") ──
    if (!tipo && (body as any)?.url_pagina) {
      const client = getSupabaseAdmin();
      if (!client) throw new Error('Supabase no configurado');
      const { error } = await client.from('events').insert(eventoRow(body as Record<string, unknown>));
      if (error) {
        await client.from('integration_logs').insert({
          integration: 'slt',
          status: 'error',
          request_payload: { tipo: 'wli_tracking', saved: false, reason: error.message, code: error.code, table: 'events', user_email: (body as any).user_email, session_id: (body as any).session_id, site: extractSite(body) } as any,
          error_message: `${error.message} (${error.code || 'no-code'}) — wli_tracking`,
        }).then(() => {}, () => {});
        throw error;
      }
      await client.from('integration_logs').insert({
        integration: 'slt',
        status: 'success',
        request_payload: { tipo: 'wli_tracking', saved: true, user_email: (body as any).user_email, session_id: (body as any).session_id, site: extractSite(body) } as any,
      }).then(() => {}, () => {});
      return jsonRes({ ok: true, mode: 'wli_tracking' });
    }

    switch (tipo) {
      case 'evento': {
        const parsed = eventoSchema.safeParse(body);
        if (!parsed.success) return jsonRes({ error: 'Validation error', details: parsed.error.flatten() }, 400);
        const result = await handleEvento(parsed.data);
        return jsonRes(result);
      }
      case 'bulk_eventos': {
        const result = await handleBulkEventos(body);
        return jsonRes(result);
      }
      case 'redirect': {
        const parsed = redirectSchema.safeParse(body);
        if (!parsed.success) return jsonRes({ error: 'Validation error', details: parsed.error.flatten() }, 400);
        const result = await handleRedirect(parsed.data);
        return jsonRes(result);
      }
      case 'bulk_redirects': {
        const result = await handleBulkRedirects(body);
        return jsonRes(result);
      }
      case 'webhook': {
        const parsed = webhookSchema.safeParse(body);
        if (!parsed.success) return jsonRes({ error: 'Validation error', details: parsed.error.flatten() }, 400);
        const result = await handleWebhook(parsed.data);
        return jsonRes(result);
      }
      case 'bulk_webhooks': {
        const result = await handleBulkWebhooks(body);
        return jsonRes(result);
      }
      case 'test_connection': {
        const client = getSupabaseAdmin();
        if (client) {
          await client.from('integration_logs').insert({
            integration: 'slt',
            status: 'success',
            request_payload: { tipo: 'test_connection', saved: true, source: 'wordpress', site: extractSite(body) },
          }).then(() => {}, () => {});
        }
        return jsonRes({ ok: true, message: 'Conexión exitosa con wlo-slt', timestamp: new Date().toISOString() });
      }
      default:
        return jsonRes({ error: `Tipo desconocido: ${tipo}. Tipos válidos: evento, bulk_eventos, redirect, bulk_redirects, webhook, bulk_webhooks, test_connection` }, 400);
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
      bulk_eventos: 'Importación masiva de eventos',
      redirect: 'Clicks en enlaces cortos / redirects',
      bulk_redirects: 'Importación masiva de redirects',
      webhook: 'Webhooks de CRM (Pipedrive, ClickUp, etc.)',
      bulk_webhooks: 'Importación masiva de webhooks',
      test_connection: 'Prueba de conexión desde el plugin',
      wli_tracking: 'WLi Tracking sin campo "tipo" (fire-and-forget)',
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
