import { getSubmissions } from '@/lib/data';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || '50');
    const rows = await getSubmissions(limit);
    return Response.json(rows);
  } catch (e: any) {
    return Response.json({ error: e?.message || 'submissions error' }, { status: 500 });
  }
}
