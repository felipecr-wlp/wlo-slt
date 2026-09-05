import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url') || '';
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const match = searchParams.get('match') || 'exact';

  if (!url) return Response.json({ error: 'url requerida' }, { status: 400 });

  const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end || new Date().toISOString().split('T')[0];

  let query = client
    .from('slt_eventos')
    .select('session_id, user_name, user_email, user_phone, elemento_id, url_pagina, observaciones, fecha, fingerprint, user_profile, user_ip')
    .gte('fecha', startDate + ' 00:00:00')
    .lte('fecha', endDate + ' 23:59:59')
    .order('fecha', { ascending: false })
    .limit(500);

  if (match === 'starts_with') {
    query = query.like('url_pagina', url + '%');
  } else {
    query = query.eq('url_pagina', url);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ leads: data || [], start: startDate, end: endDate, url, match });
}
