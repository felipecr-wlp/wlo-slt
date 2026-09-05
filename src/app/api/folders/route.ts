import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const DEFAULT_FOLDERS = [
  { name: 'Campaña Principal', color: '#2271b1', launch_date: new Date().toISOString().split('T')[0], urls: [], sort_order: 0 },
  { name: 'Landing Pages', color: '#00a32a', launch_date: new Date().toISOString().split('T')[0], urls: [], sort_order: 1 },
  { name: 'Gracias / Conversión', color: '#d63638', launch_date: new Date().toISOString().split('T')[0], urls: [], sort_order: 2 },
];

export async function GET() {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ folders: DEFAULT_FOLDERS, error: 'Supabase no configurado' });

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
  if (!client) return Response.json({ error: 'Supabase no configurado — faltan env vars en Vercel' }, { status: 500 });

  let folders: any[];
  try {
    const body = await req.json();
    folders = body.folders;
    if (!Array.isArray(folders)) return Response.json({ error: 'folders debe ser un arreglo' }, { status: 400 });
  } catch (e: any) {
    return Response.json({ error: 'JSON inválido: ' + e.message }, { status: 400 });
  }

  // Step 1: Get existing IDs
  const { data: existing, error: selErr } = await client.from('slt_folders').select('id');
  if (selErr) return Response.json({ error: 'Error leyendo carpetas: ' + selErr.message, code: selErr.code }, { status: 500 });

  // Step 2: Delete all existing
  if (existing && existing.length > 0) {
    const ids = existing.map((r: any) => r.id);
    const { error: delErr } = await client.from('slt_folders').delete().in('id', ids);
    if (delErr) return Response.json({ error: 'Error eliminando carpetas: ' + delErr.message, code: delErr.code }, { status: 500 });
  }

  // Step 3: Insert new folders (without id, let Supabase generate UUIDs)
  const rows = folders.map((f: any, i: number) => ({
    name: f.name || 'Sin nombre',
    color: f.color || '#2271b1',
    launch_date: f.launch_date || new Date().toISOString().split('T')[0],
    urls: Array.isArray(f.urls) ? f.urls : [],
    sort_order: i,
  }));

  const { data, error } = await client.from('slt_folders').insert(rows).select();
  if (error) return Response.json({ error: 'Error guardando carpetas: ' + error.message, code: error.code }, { status: 500 });

  return Response.json({ ok: true, folders: data, count: data?.length || 0 });
}
