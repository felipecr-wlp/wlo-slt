import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || '50');
  const offset = Number(searchParams.get('offset') || '0');
  const integration = searchParams.get('integration');

  let q = client
    .from('integration_logs')
    .select('id, integration, status, request_payload, error_message, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (integration && integration !== 'all') {
    q = q.eq('integration', integration);
  }

  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}
