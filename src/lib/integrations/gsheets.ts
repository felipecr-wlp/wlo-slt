import { fetchWithTimeout, type IntegrationResult } from './shared';
import type { LeadPayload } from './pipedrive';

export interface GSheetsConfig {
  spreadsheet_id: string;
  range: string; // e.g. "A1:E"
  api_key: string;
  // Para append vía API v4 se requiere OAuth; aquí usamos enfoque demo (api_key sobrevalues).
}

export async function sendToGSheets(
  config: GSheetsConfig,
  payload: LeadPayload
): Promise<IntegrationResult> {
  try {
    const row = [[
      payload.name,
      payload.email,
      payload.phone,
      new Date().toISOString(),
      JSON.stringify(payload.custom || {}),
    ]];

    const res = await fetchWithTimeout(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheet_id}/values/${encodeURIComponent(config.range)}:append?valueInputOption=RAW&key=${config.api_key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: row }),
      },
      10000
    );

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `GSheets ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'GSheets error' };
  }
}
