import { listen, type BufferedEvent } from '@/lib/ingestBuffer';

// SSE: emite eventos nuevos en tiempo real (demo-safe con buffer en memoria).
// force-dynamic evita que Next lo prerenderize (stream infinito).
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  writer.write(encoder.encode(':\n\n'));

  const onEvent = (e: BufferedEvent) => {
    const payload = {
      id: e.id,
      event_type: e.type,
      element_id: e.element_id,
      url: e.url,
      referrer: e.referrer || null,
      country: (e as any).country || null,
      device_type: e.device_type || null,
      created_at: e.timestamp || new Date().toISOString(),
    };
    writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)).catch(() => {});
  };
  const remove = listen(onEvent);

  const interval = setInterval(() => {
    writer.write(encoder.encode(':\n\n')).catch(() => {});
  }, 15000);

  req.signal?.addEventListener('abort', () => {
    clearInterval(interval);
    remove();
    writer.close().catch(() => {});
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}