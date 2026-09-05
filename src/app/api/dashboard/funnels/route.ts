import { getFunnels, getEventsByType } from '@/lib/data';

const noCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET() {
  try {
    const funnels = await getFunnels();
    const byType = await getEventsByType();
    return Response.json({ funnels, byType }, { headers: noCache });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'funnels error' }, { status: 500, headers: noCache });
  }
}
