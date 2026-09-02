import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

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

  return Response.json(results, { headers: { 'Content-Type': 'application/json' } });
}
