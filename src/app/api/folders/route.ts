import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const DEFAULT_FOLDERS = [
  { name: 'Campaña Principal', color: '#2271b1', launch_date: new Date().toISOString().split('T')[0], urls: [], sort_order: 0 },
  { name: 'Landing Pages', color: '#00a32a', launch_date: new Date().toISOString().split('T')[0], urls: [], sort_order: 1 },
  { name: 'Gracias / Conversión', color: '#d63638', launch_date: new Date().toISOString().split('T')[0], urls: [], sort_order: 2 },
];

export async function GET() {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ folders: DEFAULT_FOLDERS });

  const { data, error } = await client
    .from('slt_folders')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return Response.json({ folders: DEFAULT_FOLDERS, error: error.message });

  if (!data || data.length === 0) {
    const { data: inserted, error: insErr } = await client
      .from('slt_folders')
      .insert(DEFAULT_FOLDERS)
      .select();
    if (insErr) return Response.json({ folders: DEFAULT_FOLDERS, error: insErr.message });
    return Response.json({ folders: inserted || DEFAULT_FOLDERS });
  }

  return Response.json({ folders: data });
}

export async function PUT(req: Request) {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  const { folders } = await req.json();

  // Get all existing IDs and delete them
  const { data: existing } = await client.from('slt_folders').select('id');
  if (existing?.length) {
    const ids = existing.map((r: any) => r.id);
    await client.from('slt_folders').delete().in('id', ids);
  }

  const rows = folders.map((f: any, i: number) => ({
    name: f.name,
    color: f.color,
    launch_date: f.launch_date,
    urls: f.urls || [],
    sort_order: i,
  }));

  const { data, error } = await client.from('slt_folders').insert(rows).select();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true, folders: data });
}
