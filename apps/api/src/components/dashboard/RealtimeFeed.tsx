'use client';
import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { EventRow } from '@slt/shared-types';

// Consumes el SSE /api/dashboard/realtime y muestra eventos en vivo.
export function RealtimeFeed() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const source = new EventSource('/api/dashboard/realtime');
    source.onopen = () => setOnline(true);
    source.onerror = () => setOnline(false);
    source.onmessage = (e) => {
      try {
        const data: EventRow = JSON.parse(e.data);
        setEvents((prev) => [data, ...prev].slice(0, 15));
      } catch {}
    };
    return () => source.close();
  }, []);

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="font-medium">Eventos en vivo</span>
        <Badge variant={online ? 'default' : 'destructive'}>{online ? 'Conectado' : 'Desconectado'}</Badge>
      </div>
      {events.length === 0 ? (
        <p className="p-3 text-sm text-gray-500">Esperando eventos…</p>
      ) : (
        <ul className="divide-y text-sm">
          {events.map((e) => (
            <li key={e.id} className="flex justify-between px-3 py-2">
              <span className="truncate">{e.event_type}: {e.element_id || e.url}</span>
              <span className="text-xs text-gray-500">{formatDate(e.created_at || '')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
