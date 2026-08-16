import type { Form } from '@slt/shared-types';
import {
  sendToPipedrive,
  sendToClickUp,
  sendToSupabase as sendToSupabaseInt,
  sendToGSheets,
  sendToWLI,
  sendToESP,
  type IntegrationResult,
} from './integrations';
import { getSupabaseAdmin } from './supabase-admin';
import { hashPayload } from './integrations/shared';

export interface RoutingLog {
  integration: string;
  result: IntegrationResult;
  duration_ms: number;
}

// Procesa routing de un formulario de forma asíncrona (no bloquea la respuesta).
// Demo-safe: si faltan configs o falla, registra logs pero no lanza.
export async function processFormRouting(
  form: Form,
  data: Record<string, unknown>,
  submissionId: string
): Promise<RoutingLog[]> {
  const logs: RoutingLog[] = [];
  const routing = (form.routing as Record<string, unknown>) || {};
  const payload = extractLead(data);
  const technical = JSON.parse(JSON.stringify(data));

  const tasks: Array<Promise<RoutingLog | null>> = [];

  if (routing.pipedrive) {
    tasks.push(run('pipedrive', () => sendToPipedrive(routing.pipedrive as any, { ...payload, submission_id: submissionId })));
  }
  if (routing.clickup) {
    tasks.push(run('clickup', () => sendToClickUp(routing.clickup as any, { ...payload, submission_id: submissionId })));
  }
  if (routing.supabase) {
    tasks.push(run('supabase', () => sendToSupabaseInt(routing.supabase as any, { ...payload, submission_id: submissionId })));
  }
  if (routing.gsheets) {
    tasks.push(run('gsheets', () => sendToGSheets(routing.gsheets as any, { ...payload, submission_id: submissionId })));
  }
  if (routing.wli) {
    tasks.push(run('wli', () => sendToWLI(routing.wli as any, { ...payload, submission_id: submissionId })));
  }
  if (routing.esp) {
    tasks.push(run('esp', () => sendToESP(routing.esp as any, { ...payload, submission_id: submissionId })));
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) logs.push(r.value);
  }

  // Persistir logs de integración (demo: silencioso si no hay DB)
  try {
    const client = getSupabaseAdmin();
    if (client) {
      const rows = logs.map((l) => ({
        integration: l.integration,
        form_id: form.id,
        submission_id: submissionId,
        status: l.result.ok ? 'success' : 'error',
        request_payload: payload,
        response_body: l.result,
        error_message: l.result.error,
        duration_ms: l.duration_ms,
      }));
      await client.from('integration_logs').insert(rows);
    }
  } catch {
    // demo
  }

  void technical;
  void hashPayload;
  return logs;
}

async function run(
  integration: string,
  fn: () => Promise<IntegrationResult>
): Promise<RoutingLog | null> {
  const start = Date.now();
  try {
    const result = await fn();
    return { integration, result, duration_ms: Date.now() - start };
  } catch (e: any) {
    return { integration, result: { ok: false, error: e?.message || 'error' }, duration_ms: Date.now() - start };
  }
}

function extractLead(data: Record<string, unknown>): { name?: string; email?: string; phone?: string; custom: Record<string, unknown> } {
  const email = findFirst(data, ['email', 'correo', 'mail', 'e-mail']);
  const phone = findFirst(data, ['phone', 'telefono', 'tel', 'mobile', 'celular']);
  const name = findFirst(data, ['name', 'nombre', 'fullname', 'contact_name']);
  const custom: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!['email', 'correo', 'mail', 'e-mail', 'phone', 'telefono', 'tel', 'mobile', 'celular', 'name', 'nombre', 'fullname', 'contact_name'].includes(k)) {
      custom[k] = v;
    }
  }
  return { name, email, phone, custom };
}

function findFirst(data: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = data[k];
    if (typeof v === 'string' && v.length) return v;
  }
  return undefined;
}
