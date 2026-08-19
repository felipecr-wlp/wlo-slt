import { fetchWithTimeout } from './shared';

export interface PipedriveConfig {
  api_key: string;
  base_url?: string;
}

export interface LeadPayload {
  name?: string;
  email?: string;
  phone?: string;
  custom?: Record<string, unknown>;
  form_id?: string;
  submission_id?: string;
}

export async function sendToPipedrive(
  config: PipedriveConfig,
  payload: LeadPayload
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const baseUrl = config.base_url || 'https://api.pipedrive.com/v1';
    const lead: Record<string, unknown> = {
      title: payload.name || payload.email || 'Lead sin nombre',
    };
    if (payload.email) lead.email = [{ value: payload.email, primary: true }];
    if (payload.phone) lead.phone = [{ value: payload.phone, primary: true }];
    if (payload.custom) Object.assign(lead, payload.custom);

    const res = await fetchWithTimeout(
      `${baseUrl}/leads?api_token=${config.api_key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, user_id: true }),
      },
      10000
    );

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Pipedrive ${res.status}: ${body}` };
    }
    const data = await res.json();
    return { ok: true, id: data?.data?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Pipedrive error' };
  }
}
