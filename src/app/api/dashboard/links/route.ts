import { getShortLinks } from '@/lib/data';

const noCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET() {
  try {
    const rows = await getShortLinks();
    return Response.json(rows, { headers: noCache });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'links error' }, { status: 500, headers: noCache });
  }
}
