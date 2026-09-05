import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const noCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET() {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado — faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY' });

  const tables = [
    'events', 'sessions', 'integration_logs', 'form_submissions',
    'short_links', 'redirect_clicks', 'forms', 'api_keys',
    'slt_eventos', 'slt_folders',
  ];
  const results: Record<string, { count: number; sample: unknown[]; error?: string }> = {};

  for (const table of tables) {
    const { count, error: countErr } = await client.from(table).select('*', { count: 'exact', head: true });
    if (countErr) {
      results[table] = { count: -1, sample: [], error: countErr.message };
      continue;
    }
    const { data: sample, error: sampleErr } = await client.from(table).select('*').limit(2);
    results[table] = { count: count ?? 0, sample: sample ?? [], error: sampleErr?.message };
  }

  const { data: evTest, error: evErr } = await client
    .from('events')
    .select('id, event_type, url, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: sltTest, error: sltErr } = await client
    .from('slt_eventos')
    .select('id, url_pagina, elemento_id, user_email, fecha')
    .order('fecha', { ascending: false })
    .limit(3);

  return Response.json({
    ok: true,
    tables: results,
    events_query: { data: evTest ?? [], error: evErr?.message ?? null },
    slt_eventos_query: { data: sltTest ?? [], error: sltErr?.message ?? null },
  }, { headers: { 'Content-Type': 'application/json', ...noCache } });
}
