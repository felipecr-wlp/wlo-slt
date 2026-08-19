import { fetchWithTimeout, type IntegrationResult } from './shared';
import type { LeadPayload } from './pipedrive';

export interface SupabaseIntegrationConfig {
  project_url: string;
  anon_key: string;
  table: string;
}

// Inserta el lead en una tabla de Supabase remoto usando su cliente público.
export async function sendToSupabase(
  config: SupabaseIntegrationConfig,
  payload: LeadPayload
): Promise<IntegrationResult> {
  try {
    const res = await fetchWithTimeout(`${config.project_url}/rest/v1/${config.table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.anon_key,
        Authorization: `Bearer ${config.anon_key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        nombre: payload.name,
        email: payload.email,
        telefono: payload.phone,
        ...payload.custom,
      }),
    }, 10000);

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Remote Supabase ${res.status}: ${body}` };
    }
    return { ok: true, id: payload.submission_id };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Supabase integration error' };
  }
}
