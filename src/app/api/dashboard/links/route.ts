import { getShortLinks } from '@/lib/data';

export async function GET() {
  try {
    const rows = await getShortLinks();
    return Response.json(rows);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'links error' }, { status: 500 });
  }
}
