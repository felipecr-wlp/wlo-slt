import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { generateApiKeyFull } from '@/lib/apiKeys';

export async function GET() {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  const { data, error } = await client
    .from('api_keys')
    .select('id, name, key_prefix, endpoint, is_active, created_at, last_used_at, expires_at')
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}

export async function POST(req: Request) {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const name = body.name as string;
  const endpoint = (body.endpoint as string) || 'slt';
  const expiresInDays = body.expires_in_days as number | undefined;

  if (!name) return Response.json({ error: 'name es requerido' }, { status: 400 });

  const { key, hash, keyPrefix } = await generateApiKeyFull('slt');

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
    : null;

  const { error } = await client.from('api_keys').insert({
    name,
    key_hash: hash,
    key_prefix: keyPrefix,
    endpoint,
    expires_at: expiresAt,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ key, name, key_prefix: keyPrefix, endpoint, expires_at: expiresAt });
}

export async function DELETE(req: Request) {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ error: 'id es requerido' }, { status: 400 });

  const { error } = await client.from('api_keys').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
