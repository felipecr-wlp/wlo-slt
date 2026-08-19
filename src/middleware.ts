import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge middleware: CORS (tracker + forms), security headers, prelim de bot detection.
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Security headers globales (aplicables a todas las rutas).
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');

  const isApi = req.nextUrl.pathname.startsWith('/api/');
  const isTracker = req.nextUrl.pathname.startsWith('/api/ingest') || req.nextUrl.pathname.startsWith('/api/forms');

  if (isTracker) {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET, PATCH, DELETE');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Fingerprint');
    res.headers.set('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: res.headers });
    }
  }

  // TODO: rate limit distribuido con Vercel KV para endpoints públicos.
  void isApi;
  return res;
}

export const config = {
  matcher: ['/api/:path*', '/go/:path*'],
};