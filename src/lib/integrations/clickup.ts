import { fetchWithTimeout } from './shared';
import type { LeadPayload } from './pipedrive';

export interface ClickUpConfig {
  api_key: string;
  base_url?: string;
  list_id: string;
}

export async function sendToClickUp(
  config: ClickUpConfig,
  payload: LeadPayload
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const baseUrl = config.base_url || 'https://api.clickup.com/api/v2';
    const name = payload.name || payload.email || 'Lead';
    const res = await fetchWithTimeout(`${baseUrl}/list/${config.list_id}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.api_key,
      },
      body: JSON.stringify({
        name,
        description: Object.entries(payload.custom || {}).map(([k, v]) => `${k}: ${v}`).join('\n'),
        fields: payload.custom,
      }),
    }, 10000);

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `ClickUp ${res.status}: ${body}` };
    }
    const data = await res.json();
    return { ok: true, id: data?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'ClickUp error' };
  }
}
