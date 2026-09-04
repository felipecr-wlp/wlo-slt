import { getSupabaseAdmin } from '@/lib/supabase-admin';

const MAX_LOGS = 200;
const noCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET(req: Request) {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500, headers: noCache });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || '50');
  const offset = Number(searchParams.get('offset') || '0');
  const integration = searchParams.get('integration');
  const exclude = searchParams.get('exclude');

  // Auto-limpiar si hay más de MAX_LOGS registros
  const { count: totalCount } = await client
    .from('integration_logs')
    .select('*', { count: 'exact', head: true });

  if ((totalCount ?? 0) > MAX_LOGS) {
    const { data: old } = await client
      .from('integration_logs')
      .select('id')
      .order('created_at', { ascending: true })
      .limit((totalCount ?? 0) - MAX_LOGS);
    if (old?.length) {
      const ids = old.map((r: { id: string }) => r.id);
      await client.from('integration_logs').delete().in('id', ids);
    }
  }

  let q = client
    .from('integration_logs')
    .select('id, integration, status, request_payload, error_message, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (integration && integration !== 'all') {
    q = q.eq('integration', integration);
  }

  if (exclude) {
    const excludeTypes = exclude.split(',');
    q = q.not('request_payload->>tipo', 'in', `(${excludeTypes.join(',')})`);
  }

  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });
  return Response.json({ data: data ?? [], total: totalCount ?? 0 }, { headers: noCache });
}
