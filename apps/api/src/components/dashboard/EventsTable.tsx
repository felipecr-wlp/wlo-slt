import { formatDate } from '@/lib/utils';
import type { EventRow } from '@slt/shared-types';
import { Badge } from '@/components/ui/badge';

export function EventsTable({ events }: { events: EventRow[] }) {
  if (!events?.length) {
    return <p className="text-sm text-gray-500 py-6">No hay eventos registrados.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full caption-bottom text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Tipo</th>
            <th className="px-3 py-2 text-left font-medium">URL</th>
            <th className="px-3 py-2 text-left font-medium">Elemento</th>
            <th className="px-3 py-2 text-left font-medium">Dispositivo</th>
            <th className="px-3 py-2 text-left font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b">
              <td className="px-3 py-2">
                <Badge variant="outline">{e.event_type}</Badge>
              </td>
              <td className="px-3 py-2 max-w-xs truncate">{e.url}</td>
              <td className="px-3 py-2">{e.element_id || '-'}</td>
              <td className="px-3 py-2">{e.device_type || '-'}</td>
              <td className="px-3 py-2 text-gray-500">{formatDate(e.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
