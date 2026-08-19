import { getEvents } from '@/lib/data';
import { EventsTable } from '@/components/dashboard/EventsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Eventos | wlo-slt' };

export default async function EventsPage({ searchParams }: { searchParams: { type?: string } }) {
  const all = await getEvents(100);
  const typeFilter = searchParams?.type;
  const events = typeFilter ? all.filter((e) => e.event_type === typeFilter) : all;
  const types = Array.from(new Set(all.map((e) => e.event_type)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <a
              key={t}
              href={`/dashboard/events?type=${t}`}
              className={`rounded-md border px-3 py-1 text-sm ${
                t === typeFilter ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800'
              }`}
            >
              {t}
            </a>
          ))}
          <a href="/dashboard/events" className="rounded-md border px-3 py-1 text-sm">
            Todos
          </a>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tabla de eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <EventsTable events={events} />
        </CardContent>
      </Card>
    </div>
  );
}
