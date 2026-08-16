import { fetchWithTimeout, type IntegrationResult } from './shared';
import type { LeadPayload } from './pipedrive';

export interface WLIConfig {
  endpoint: string;
  auth_token?: string;
  workspace_id?: string;
}

// Webhook genérico a un endpoint externo (ej. Web Liada / WLI).
export async function sendToWLI(
  config: WLIConfig,
  payload: LeadPayload
): Promise<IntegrationResult> {
  try {
    const res = await fetchWithTimeout(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.auth_token ? { Authorization: `Bearer ${config.auth_token}` } : {}),
      },
      body: JSON.stringify({
        workspace_id: config.workspace_id,
        lead: payload,
      }),
    }, 10000);

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `WLI ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'WLI error' };
  }
}
