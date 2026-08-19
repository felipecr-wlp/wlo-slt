import { getSupabaseAdmin } from './supabase-admin';
import { addEvent } from './ingestBuffer';

// Helper demo-safe: registra un evento de webhook + log de integracion.
// body: any para tolerar payloads arbitrarios sin romper el tipado.
export async function recordWebhook(source: string, body: any): Promise<{ ok: boolean; error?: string }> {
  try {
    const event = {
      site_id: String(body?.site_id || body?.siteId || source),
      session_id: String(body?.session_id || body?.sessionId || `${source}-${crypto.randomUUID?.() || ''}`),
      fingerprint: String(body?.fingerprint || body?.fp || `webhook-${source}`),
      type: 'custom' as const,
      element_id: String(body?.form_id || `${source}_webhook`),
      url: String(body?.webhook_url || body?.url || `https://wlo-slt.vercel.app/integrations/${source}`),
      payload:
        typeof body === 'object' && body !== null
          ? (body as Record<string, unknown>)
          : { raw: String(body) },
      timestamp: new Date().toISOString(),
    };

    const client = getSupabaseAdmin();
    if (client) {
      try {
        await client.from('events').insert({
          session_id: event.session_id,
          event_type: 'webhook',
          element_id: source,
          url: event.url,
          fingerprint: event.fingerprint,
          payload: JSON.stringify(event.payload),
        });
        await client.from('integration_logs').insert({
          integration: source,
          status: 'success',
          request_payload: event.payload,
        });
      } catch {
        addEvent(event);
      }
    } else {
      addEvent(event);
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || `${source} webhook error` };
  }
}