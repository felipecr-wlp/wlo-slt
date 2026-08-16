import { getFormById } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { upsertForm, addSubmission } from '@/lib/demoStore';
import { formSubmissionSchema } from '@/lib/validators';
import { processFormRouting } from '@/lib/form-routing';
import { sendNotificationEmail } from '@/lib/email';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await getFormById(params.id);
  if (!form) return Response.json({ error: 'Form not found' }, { status: 404 });
  return Response.json(form);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();
    const client = getSupabaseAdmin();
    if (client) {
      const { data, error } = await client
        .from('forms')
        .update({ ...body, id: undefined, updated_at: now })
        .eq('id', params.id)
        .select()
        .single();
      if (error) throw error;
      return Response.json(data);
    }
    const form = await getFormById(params.id);
    if (!form) return Response.json({ error: 'Form not found' }, { status: 404 });
    const updated = { ...form, ...body, updated_at: now };
    upsertForm(updated);
    return Response.json(updated);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'update error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = getSupabaseAdmin();
    if (client) {
      const { error } = await client.from('forms').delete().eq('id', params.id);
      if (error) throw error;
    }
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'delete error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const form = await getFormById(params.id);
    if (!form) return Response.json({ error: 'Form not found' }, { status: 404 });

    const body = await req.json();
    const parsed = formSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const { data, session_id, fingerprint, referrer_url, utm_data, technical } = parsed.data;

    const submissionId = crypto.randomUUID?.() || Math.random().toString(36);
    const submission = {
      id: submissionId,
      form_id: form.id,
      session_id: session_id || undefined,
      fingerprint: fingerprint || undefined,
      data,
      lead_name: extractField(data, ['nombre', 'name', 'fullname', 'contact_name']),
      lead_email: extractField(data, ['email', 'correo', 'mail']),
      lead_phone: extractField(data, ['telefono', 'phone', 'tel', 'mobile', 'celular']),
      referrer_url,
      utm_data,
      technical,
      routing_logs: null,
      status: 'new',
      created_at: new Date().toISOString(),
    };

    const client = getSupabaseAdmin();
    if (client) {
      try {
        await client.from('form_submissions').insert(submission);
      } catch {
        addSubmission(submission as any);
      }
    } else {
      addSubmission(submission as any);
    }

    processFormRouting(form, data, submissionId).catch(() => {});
    if (form.routing?.email_notify) sendNotificationEmail(form, data, submissionId).catch(() => {});

    return Response.json({ ok: true, submission_id: submissionId });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'submit error' }, { status: 500 });
  }
}

function extractField(data: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = data[k];
    if (typeof v === 'string' && v.length) return v;
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return undefined;
}