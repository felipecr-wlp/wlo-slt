import { getShortLinks } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { shortLinkSchema } from '@/lib/validators';
import type { NextRequest } from 'next/server';

export async function GET() {
  try {
    const links = await getShortLinks();
    return Response.json(links);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'redirects list error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = shortLinkSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const client = getSupabaseAdmin();
    const now = new Date().toISOString();
    const link = {
      id: parsed.data.id || (`lnk_${Math.random().toString(36).slice(2, 8)}`),
      name: parsed.data.name,
      slug: parsed.data.slug,
      target_url: parsed.data.target_url,
      plataforma: parsed.data.plataforma || 'General',
      clicks: 0,
      created_at: now,
      updated_at: now,
    };

    if (client) {
      const { data, error } = await client.from('short_links').insert(link).select().single();
      if (error) throw error;
      return Response.json(data, { status: 201 });
    }
    return Response.json(link, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'create error' }, { status: 500 });
  }
}
