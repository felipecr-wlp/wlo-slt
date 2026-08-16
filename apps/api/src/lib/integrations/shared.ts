// Helpers compartidos para integraciones (demo-safe).

export function hashPayload(payload: Record<string, unknown>): string {
  const s = JSON.stringify(payload);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(t));
}

export interface IntegrationResult {
  ok: boolean;
  id?: string;
  error?: string;
  demo?: boolean;
}

export async function logIntegration(
  supabase: any,
  integration: string,
  details: {
    form_id?: string;
    submission_id?: string;
    status: 'success' | 'error' | 'retry';
    request_payload?: unknown;
    response_body?: unknown;
    error_message?: string;
    duration_ms?: number;
  }
) {
  try {
    await supabase.from('integration_logs').insert({
      integration,
      ...details,
    });
  } catch {
    // demo: silencioso
  }
}
