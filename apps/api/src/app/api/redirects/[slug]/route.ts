import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getShortLinkBySlug } from '@/lib/data';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const link = await getShortLinkBySlug(params.slug);
  if (!link) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(link);
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await req.json();
    const client = getSupabaseAdmin();
    const now = new Date().toISOString();
    if (client) {
      const { data, error } = await client
        .from('short_links')
        .update({
          name: body.name,
          slug: body.slug,
          target_url: body.target_url,
          plataforma: body.plataforma,
          updated_at: now,
        })
        .eq('slug', params.slug)
        .select()
        .single();
      if (error) throw error;
      return Response.json(data);
    }
    const existing = await getShortLinkBySlug(params.slug);
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ ...existing, ...body, updated_at: now });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'update error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const client = getSupabaseAdmin();
    if (client) {
      const { error } = await client.from('short_links').delete().eq('slug', params.slug);
      if (error) throw error;
    }
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'delete error' }, { status: 500 });
  }
}
