import { createClient } from '@supabase/supabase-js';

// Cliente browser (anon key). Retorna null cuando faltan las env → el dashboard
// muestra mock data y desactiva el realtime. Demo-safe.
let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (client) return client;
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) return null;
  client = createClient(url, key);
  return client;
}
