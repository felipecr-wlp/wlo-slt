import { getFunnels, getEventsByType } from '@/lib/data';

export async function GET() {
  try {
    const funnels = await getFunnels();
    const byType = getEventsByType();
    return Response.json({ funnels, byType });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'funnels error' }, { status: 500 });
  }
}
