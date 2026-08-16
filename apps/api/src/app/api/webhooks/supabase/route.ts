import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Webhook: inserción directa de leads en Supabase (desde otro proyecto)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const client = getSupabaseAdmin();
    if (client && body?.table && body?.record) {
      try {
        await client.from(String(body.table)).insert(body.record);
      } catch (e: any) {
        return Response.json({ ok: false, error: e?.message }, { status: 500 });
      }
    }
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'webhook error' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ service: 'supabase webhook', ok: true });
}
