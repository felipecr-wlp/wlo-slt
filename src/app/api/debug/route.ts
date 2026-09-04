import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const noCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET() {
  const client = getSupabaseAdmin();
  if (!client) return Response.json({ error: 'Supabase no configurado' });

  const tables = ['events', 'sessions', 'integration_logs', 'form_submissions', 'short_links', 'redirect_clicks', 'forms'];
  const results: Record<string, { count: number; sample: unknown[]; error?: string }> = {};

  for (const table of tables) {
    const { count, error: countErr } = await client.from(table).select('*', { count: 'exact', head: true });
    if (countErr) {
      results[table] = { count: -1, sample: [], error: countErr.message };
      continue;
    }
    const { data: sample, error: sampleErr } = await client.from(table).select('*').limit(2);
    results[table] = { count: count ?? 0, sample: sample ?? [], error: sampleErr?.message };
  }

  // Also check: can service_role actually read events?
  const { data: evTest, error: evErr } = await client
    .from('events')
    .select('id, event_type, url, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  return Response.json({
    tables: results,
    events_query: { data: evTest ?? [], error: evErr?.message ?? null },
  }, { headers: { 'Content-Type': 'application/json', ...noCache } });
}
