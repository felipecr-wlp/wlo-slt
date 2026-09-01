import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  try {
    const body = await req.json();
    const { is_active, name, expires_at } = body;

    const updates: Record<string, unknown> = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (name !== undefined) updates.name = name;
    if (expires_at !== undefined) updates.expires_at = expires_at;

    const { data, error } = await client
      .from('api_keys')
      .update(updates)
      .eq('id', params.id)
      .select('id, name, key_prefix, endpoint, is_active, permissions, created_at, last_used_at, expires_at')
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  try {
    const { error } = await client.from('api_keys').delete().eq('id', params.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Error al eliminar' }, { status: 500 });
  }
}
