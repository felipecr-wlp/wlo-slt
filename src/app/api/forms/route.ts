import { getForms } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { upsertForm } from '@/lib/demoStore';
import type { NextRequest } from 'next/server';

export async function GET() {
  try {
    const forms = await getForms();
    return Response.json(forms);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'forms list error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getSupabaseAdmin();

    const form = {
      id: body.id || crypto.randomUUID?.() || Math.random().toString(36),
      title: body.title || (body.id as string) || 'Sin titulo',
      page_url: body.page_url || null,
      fields: Array.isArray(body.fields) ? body.fields : [],
      routing: body.routing || {},
      action_type: body.action_type || 'message',
      redirect_url: body.redirect_url || null,
      txt_submit: body.txt_submit || 'Enviar',
      txt_success: body.txt_success || 'Gracias!',
      txt_error: body.txt_error || 'Error al enviar',
      txt_next: body.txt_next || 'Siguiente',
      txt_prev: body.txt_prev || 'Atras',
      colors: body.colors || {},
      rules: Array.isArray(body.rules) ? body.rules : [],
      status: body.status || 'active',
      group_name: body.group_name || 'General',
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (client) {
      const { data, error } = await client.from('forms').insert(form).select().single();
      if (error) throw error;
      return Response.json(data, { status: 201 });
    }

    upsertForm(form);
    return Response.json(form, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'create error' }, { status: 500 });
  }
}