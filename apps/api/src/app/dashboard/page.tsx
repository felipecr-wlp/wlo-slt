import { getStats, getEvents, getSubmissions, getShortLinks } from '@/lib/data';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { EventsTable } from '@/components/dashboard/EventsTable';
import { FormsOverview } from '@/components/dashboard/FormsOverview';
import { RedirectsOverview } from '@/components/dashboard/RedirectsOverview';
import { FunnelChart } from '@/components/dashboard/FunnelChart';
import { EventTypeChart } from '@/components/dashboard/EventTypeChart';
import { RealtimeFeed } from '@/components/dashboard/RealtimeFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Dashboard | wlo-slt' };

export default async function DashboardPage() {
  const [stats, events, submissions, links] = await Promise.all([
    getStats(),
    getEvents(10),
    getSubmissions(10),
    getShortLinks(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📊 Simple Lead Tracker</h1>
        <span className="text-sm text-gray-500">Demo sin base de datos</span>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Eventos recientes</CardTitle></CardHeader>
          <CardContent><EventsTable events={events} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tipos de evento</CardTitle></CardHeader>
          <CardContent><EventTypeChart /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Conversión (funnel)</CardTitle></CardHeader>
        <CardContent><FunnelChart /></CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Últimos leads</CardTitle></CardHeader>
          <CardContent><FormsOverview submissions={submissions} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Redirects activos</CardTitle></CardHeader>
          <CardContent><RedirectsOverview links={links} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Eventos en vivo</CardTitle></CardHeader>
        <CardContent>
          <RealtimeFeed />
        </CardContent>
      </Card>
    </div>
  );
}
