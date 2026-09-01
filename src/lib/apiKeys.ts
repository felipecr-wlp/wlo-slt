import { getSupabaseAdmin } from './supabase-admin';

// Genera una API key segura con prefijo legible
export function generateApiKey(prefix: string): { key: string; hash: string; keyPrefix: string } {
  const random = crypto.randomUUID?.().replace(/-/g, '') || Math.random().toString(36).slice(2);
  const key = `${prefix}_${random}`;
  const keyPrefix = key.slice(0, 12);
  return { key, hash: '', keyPrefix };
}

// Hash SHA-256 de la key para almacenar en DB
export async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Genera key + hash completo
export async function generateApiKeyFull(prefix: string): Promise<{ key: string; hash: string; keyPrefix: string }> {
  const random = crypto.randomUUID?.().replace(/-/g, '') || Math.random().toString(36).slice(2);
  const key = `${prefix}_${random}`;
  const keyPrefix = key.slice(0, 12);
  const hash = await hashKey(key);
  return { key, hash, keyPrefix };
}

// Verifica una key contra la DB
export async function verifyApiKey(key: string, endpoint?: string): Promise<{ valid: boolean; keyId?: string; name?: string }> {
  const client = getSupabaseAdmin();
  if (!client) return { valid: false };

  const hash = await hashKey(key);

  let q = client.from('api_keys').select('id, name, endpoint, is_active, expires_at').eq('key_hash', hash);
  if (endpoint) q = q.eq('endpoint', endpoint);

  const { data, error } = await q.single();
  if (error || !data) return { valid: false };

  if (!data.is_active) return { valid: false };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false };

  // Registrar uso
  await client.from('api_key_usage').insert({
    api_key_id: data.id,
    endpoint: endpoint || 'unknown',
    status: 'success',
  }).catch(() => {});

  // Actualizar last_used_at
  await client.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id).catch(() => {});

  return { valid: true, keyId: data.id, name: data.name };
}

// Verifica key sin registrar uso (para auth)
export async function checkApiKey(key: string): Promise<boolean> {
  const client = getSupabaseAdmin();
  if (!client) return false;

  const hash = await hashKey(key);

  const { data, error } = await client
    .from('api_keys')
    .select('id, is_active, expires_at')
    .eq('key_hash', hash)
    .single();

  if (error || !data) return false;
  if (!data.is_active) return false;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false;

  return true;
}
