import { getSubmissions } from '@/lib/data';

export const dynamic = 'force-dynamic';

const noCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || '50');
    const rows = await getSubmissions(limit);
    return Response.json(rows, { headers: noCache });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'submissions error' }, { status: 500, headers: noCache });
  }
}
