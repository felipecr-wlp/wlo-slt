import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { generateApiKeyFull } from '@/lib/apiKeys';

export async function GET() {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  const { data, error } = await client
    .from('api_keys')
    .select('id, name, key_prefix, endpoint, is_active, permissions, created_at, last_used_at, expires_at')
    .order('created_at', { ascending: false });

  if (error) {
    const msg = error.message.includes('does not exist')
      ? 'Tabla api_keys no existe. Ejecuta la migración 005_api_keys.sql en Supabase.'
      : error.message;
    return Response.json({ error: msg }, { status: 500 });
  }
  return Response.json(data);
}

export async function POST(req: Request) {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  try {
    const body = await req.json();
    const { name, endpoint, permissions, expires_at } = body;

    if (!name) return Response.json({ error: 'Nombre requerido' }, { status: 400 });

    const prefix = endpoint === 'wordpress' ? 'wp' : endpoint === 'slt' ? 'slt' : 'wlo';
    const { key, hash, keyPrefix } = await generateApiKeyFull(prefix);

    const { data, error } = await client.from('api_keys').insert({
      name,
      key_hash: hash,
      key_prefix: keyPrefix,
      endpoint: endpoint || 'slt',
      permissions: permissions || [],
      expires_at: expires_at || null,
    }).select('id, name, key_prefix, endpoint, is_active, created_at').single();

    if (error) {
      const msg = error.message.includes('does not exist')
        ? 'Tabla api_keys no existe. Ejecuta la migración 005_api_keys.sql en Supabase.'
        : error.message;
      throw new Error(msg);
    }

    return Response.json({
      ...data,
      key,
      message: 'Guarda esta API key. No se mostrará de nuevo.',
    }, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error al crear key' }, { status: 500 });
  }
}
