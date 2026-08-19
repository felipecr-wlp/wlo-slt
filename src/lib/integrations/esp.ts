import { fetchWithTimeout, type IntegrationResult } from './shared';
import type { LeadPayload } from './pipedrive';

export interface ESPConfig {
  base_url: string;
  api_key: string;
  list_id?: string;
}

// ESP genérico (Mailchimp-style v3 o similar). Demo-safe.
export async function sendToESP(
  config: ESPConfig,
  payload: LeadPayload
): Promise<IntegrationResult> {
  try {
    const res = await fetchWithTimeout(`${config.base_url}/lists/${config.list_id}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        email_address: payload.email,
        status: 'subscribed',
        merge_fields: {
          FNAME: payload.name?.split(' ')[0] || '',
          LNAME: payload.name?.split(' ').slice(1).join(' ') || '',
          PHONE: payload.phone || '',
        },
      }),
    }, 10000);

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `ESP ${res.status}: ${body}` };
    }
    const data = await res.json();
    return { ok: true, id: data?.id || data?.email_address };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'ESP error' };
  }
}
