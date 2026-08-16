import { sendNotificationEmail } from '@/lib/email';
import { getFormById } from '@/lib/data';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const formId = body?.form_id || body?.form;
    const submissionId = body?.submission_id || 'manual';

    if (!formId) {
      return Response.json({ error: 'form_id requerido' }, { status: 400 });
    }

    const form = await getFormById(formId);
    if (!form) {
      return Response.json({ error: 'Formulario no encontrado' }, { status: 404 });
    }

    const result = await sendNotificationEmail(form, body?.data || {}, submissionId);
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'email error' }, { status: 500 });
  }
}
