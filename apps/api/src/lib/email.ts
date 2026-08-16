import type { Form } from '@slt/shared-types';

// Envío de email de notificación. Usa Resend vía fetch (sin dependencia extra).
// Si RESEND_API_KEY falta → modo demo: log + success simulado (nunca falla el render).
export async function sendNotificationEmail(
  form: Form,
  data: Record<string, unknown>,
  submissionId: string
): Promise<{ ok: boolean; demo?: boolean; error?: string }> {
  const routing = form.routing || {};
  const to = (routing.email_to as string | undefined) || '';
  const subjectTpl = (routing.email_subject as string) || 'Nuevo lead de wlo-slt';
  const bodyTpl = (routing.email_body as string) || '';
  const from = process.env.EMAIL_FROM || 'noreply@wlo-slt.vercel.app';

  if (!to) return { ok: true, demo: true, error: 'Sin email_to configurado' };

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log('[email] (demo) notificación simulada:', {
      to,
      subject: renderTpl(subjectTpl, data),
      submissionId,
    });
    return { ok: true, demo: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: renderTpl(subjectTpl, data),
        html: renderTpl(bodyTpl, data) + `<hr><p>Submission: ${submissionId}</p>`,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Email send failed' };
  }
}

function renderTpl(tpl: string, data: Record<string, unknown>): string {
  return String(tpl || '').replace(/\{slt_(\w+)\}/g, (_, k) => String(data[k] ?? ''));
}
