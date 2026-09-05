import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const DEFAULT_FOLDERS = [
  { id: '1', name: 'Campaña Principal', color: '#2271b1', launch_date: new Date().toISOString().split('T')[0], urls: [], sort_order: 0 },
  { id: '2', name: 'Landing Pages', color: '#00a32a', launch_date: new Date().toISOString().split('T')[0], urls: [], sort_order: 1 },
  { id: '3', name: 'Gracias / Conversión', color: '#d63638', launch_date: new Date().toISOString().split('T')[0], urls: [], sort_order: 2 },
];

export async function GET() {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ folders: DEFAULT_FOLDERS });

  const { data, error } = await client
    .from('slt_folders')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return Response.json({ folders: DEFAULT_FOLDERS });

  if (!data || data.length === 0) {
    const { data: inserted } = await client
      .from('slt_folders')
      .insert(DEFAULT_FOLDERS.map((f) => ({ name: f.name, color: f.color, launch_date: f.launch_date, urls: f.urls })))
      .select();
    return Response.json({ folders: inserted || DEFAULT_FOLDERS });
  }

  return Response.json({ folders: data });
}

export async function PUT(req: Request) {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' }, { status: 500 });

  const { folders } = await req.json();

  // Delete all and re-insert
  await client.from('slt_folders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

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
