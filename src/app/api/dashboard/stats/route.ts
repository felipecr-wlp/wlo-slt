import { getStats } from '@/lib/data';

const noCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET() {
  try {
    const stats = await getStats();
    return Response.json(stats, { headers: noCache });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'stats error' }, { status: 500, headers: noCache });
  }
}
