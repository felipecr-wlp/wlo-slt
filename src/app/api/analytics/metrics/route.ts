import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const startDate = start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end || new Date().toISOString().split('T')[0];

  const { data, error } = await client.rpc('get_analytics_metrics', {
    p_start: startDate + ' 00:00:00',
    p_end: endDate + ' 23:59:59',
  }).maybeSingle();

  // Fallback: raw query if RPC doesn't exist
  if (error || !data) {
    const { data: rows, error: qErr } = await client
      .from('slt_eventos')
      .select('url_pagina, session_id, elemento_id')
      .gte('fecha', startDate + ' 00:00:00')
      .lte('fecha', endDate + ' 23:59:59');

    if (qErr) return Response.json({ error: qErr.message }, { status: 500 });

    const metricsMap: Record<string, { visitantes: Set<string>; eventos: number; conversiones: Set<string>; entradas: Set<string> }> = {};

    for (const row of rows || []) {
      const url = row.url_pagina;
      if (!metricsMap[url]) {
        metricsMap[url] = { visitantes: new Set(), eventos: 0, conversiones: new Set(), entradas: new Set() };
      }
      const m = metricsMap[url];
      m.visitantes.add(row.session_id);
      m.eventos++;

      const el = (row.elemento_id || '').toLowerCase();
      if (el.includes('click:') || el.includes('submit:') || el.includes('[regla]')) {
        m.conversiones.add(row.session_id);
      }
      if (el.startsWith('entrada')) {
        m.entradas.add(row.session_id);
      }
    }

    const result = Object.entries(metricsMap).map(([url_pagina, m]) => ({
      url_pagina,
      visitantes: m.visitantes.size,
      eventos: m.eventos,
      conversiones: m.conversiones.size,
      entradas: m.entradas.size,
    }));

    return Response.json({ metrics: result, start: startDate, end: endDate });
  }

  return Response.json({ metrics: data, start: startDate, end: endDate });
}
