// Redirigidor omnicanal /go/:slug  (Edge runtime)
import { getShortLinkBySlug } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const link = await getShortLinkBySlug(params.slug);
  if (!link) {
    return new Response('Not found', { status: 404 });
  }

  const client = getSupabaseAdmin();
  if (client) {
    // Incrementar clicks + log async (no bloquear redirect)
    client.rpc('increment_clicks', { link_id: link.id }).catch(() => {});
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const fp = req.headers.get('x-fingerprint') || 'unknown';
    client.from('redirect_clicks').insert({
      link_id: link.id,
      fingerprint: fp,
      ip_hash: ip, // notas: hash simple de demo; ver ingest para SHA-256
      referrer: req.headers.get('referer'),
      user_agent: req.headers.get('user-agent'),
      country: req.headers.get('x-vercel-ip-country') || null,
      device_type: getDeviceType(req.headers.get('user-agent')),
    }).catch(() => {});
  }

  const target = new URL(link.target_url);
  // Preservar UTM de la request en el redirect
  if (req.nextUrl.search) target.search = target.search ? target.search + '&' + req.nextUrl.searchParams.toString() : '?' + req.nextUrl.searchParams.toString();

  const res = new Response(null, {
    status: 302,
    headers: { Location: target.toString() },
  });
  return res;
}

function getDeviceType(ua: string | null): string {
  if (!ua) return 'desktop';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}
