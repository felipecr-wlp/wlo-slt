import { getStats } from '@/lib/data';

export async function GET() {
  try {
    const stats = await getStats();
    return Response.json(stats);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'stats error' }, { status: 500 });
  }
}
