import { getSupabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase();
  const { workspace_id } = req.query;

  if (!workspace_id) {
    return res.status(400).json({ message: 'workspace_id requerido' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(supabase, workspace_id, res);
    case 'POST':
      return handlePost(supabase, workspace_id, req, res);
    case 'PATCH':
      return handlePatch(supabase, workspace_id, req, res);
    case 'DELETE':
      return handleDelete(supabase, workspace_id, req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PATCH, DELETE, OPTIONS');
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

async function handleGet(supabase, workspace_id, res) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('workspace_id', workspace_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET error:', error);
    return res.status(500).json({ message: 'Error cargando items' });
  }
  return res.status(200).json(data);
}

async function handlePost(supabase, workspace_id, req, res) {
  let body = {};
  try {
    body = req.body;
  } catch {}

  const { title, completed = false } = body;
  if (!title) {
    return res.status(400).json({ message: 'title requerido' });
  }

  const { data, error } = await supabase
    .from('items')
    .insert([{ workspace_id, title: String(title), completed: !!completed }])
    .select()
    .single();

  if (error) {
    console.error('POST error:', error);
    return res.status(500).json({ message: 'Error creando item' });
  }
  return res.status(201).json(data);
}

async function handlePatch(supabase, workspace_id, req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: 'id requerido' });
  }

  let body = {};
  try {
    body = req.body;
  } catch {}

  const { title, completed } = body;
  const updates = { workspace_id };
  if (title !== undefined) updates.title = String(title);
  if (completed !== undefined) updates.completed = !!completed;

  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .eq('workspace_id', workspace_id)
    .select()
    .single();

  if (error) {
    console.error('PATCH error:', error);
    return res.status(500).json({ message: 'Error actualizando item' });
  }
  if (!data) {
    return res.status(404).json({ message: 'Item no encontrado' });
  }
  return res.status(200).json(data);
}

async function handleDelete(supabase, workspace_id, req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: 'id requerido' });
  }

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspace_id);

  if (error) {
    console.error('DELETE error:', error);
    return res.status(500).json({ message: 'Error borrando item' });
  }
  return res.status(200).json({ message: 'Item borrado' });
}
