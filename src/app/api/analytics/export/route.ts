import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

function extractEmail(row: any): string {
  if (row.user_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.user_email)) {
    return row.user_email.toLowerCase().trim();
  }
  if (row.user_name && !row.user_name.includes('Anónimo')) {
    const raw = row.user_name;
    if (raw.includes('|')) {
      const email = raw.split('|')[1]?.trim();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return email.toLowerCase();
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())) {
      return raw.trim().toLowerCase();
    }
  }
  if (row.observaciones) {
    const match = row.observaciones.match(/Email:\s*([^,\s<]+)/i);
    if (match && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(match[1].trim())) {
      return match[1].trim().toLowerCase();
    }
  }
  return '';
}

export async function GET(req: Request) {
  const client = getSupabaseAdmin();
  if (!client) return new Response('Supabase no configurado', { status: 500 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url') || '';
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const match = searchParams.get('match') || 'exact';

  if (!url) return new Response('url requerida', { status: 400 });

  const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end || new Date().toISOString().split('T')[0];

  let query = client
    .from('slt_eventos')
    .select('user_name, user_email, observaciones')
    .gte('fecha', startDate + ' 00:00:00')
    .lte('fecha', endDate + ' 23:59:59')
    .limit(5000);

  if (match === 'starts_with') {
    query = query.like('url_pagina', url + '%');
  } else {
    query = query.eq('url_pagina', url);
  }

  const { data } = await query;

  const emails = new Set<string>();
  data?.forEach((row: any) => {
    const email = extractEmail(row);
    if (email) emails.add(email);
  });

  let csv = 'Email\n';
  emails.forEach((email) => { csv += email + '\n'; });

  const sanitized = url.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  const filename = `emails_${sanitized}_${new Date().toISOString().split('T')[0]}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
