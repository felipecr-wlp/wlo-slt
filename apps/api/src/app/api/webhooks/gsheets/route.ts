import { recordWebhook } from '@/lib/webhookEvents';
export async function POST(req: Request) {
  try {
    const body: any = await req.json();
    const r = await recordWebhook('gsheets', body);
    return Response.json(r);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'webhook error' }, { status: 500 });
  }
}
export async function GET() {
  return Response.json({ service: 'gsheets webhook', ok: true });
}