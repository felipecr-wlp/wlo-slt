import { searchEvents, clearDataTable, exportTable, importRows, toCsv } from '@/lib/data';

const noCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'search';

    if (action === 'export') {
      const type = (searchParams.get('type') as any) || 'events';
      const result = await exportTable(type);
      const format = searchParams.get('format');
      if (format === 'csv') {
        return new Response(toCsv(result.rows), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${type}-export.csv"`,
            ...noCache,
          },
        });
      }
      return Response.json(result, { headers: noCache });
    }

    if (action === 'search') {
      const url = searchParams.get('url') || undefined;
      const type = searchParams.get('type') || undefined;
      const limit = Number(searchParams.get('limit') || '50');
      const rows = await searchEvents({ url, type, limit });
      return Response.json({ rows, count: rows.length }, { headers: noCache });
    }

    return new Response('Bad request', { status: 400, headers: noCache });
  } catch (e: any) {
    return new Response(e?.message || 'error', { status: 400, headers: noCache });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'clear';

    if (action === 'clear') {
      const table = searchParams.get('table') || 'events';
      const res = await clearDataTable(table);
      return Response.json(res, { headers: noCache });
    }

    if (action === 'import') {
      const type = (searchParams.get('type') as any) || 'events';
      const body = await req.json();
      const rows: any[] = Array.isArray(body?.rows ? body.rows : body) ? (body?.rows ? body.rows : body) : [];
      const res = await importRows(type, rows);
      return Response.json(res, { headers: noCache });
    }

    return new Response('Bad request', { status: 400, headers: noCache });
  } catch (e: any) {
    return new Response(e?.message || 'error', { status: 400, headers: noCache });
  }
}
