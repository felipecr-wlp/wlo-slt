import { getStats, getEvents, getSubmissions, getShortLinks } from '@/lib/data';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { EventsTable } from '@/components/dashboard/EventsTable';
import { FormsOverview } from '@/components/dashboard/FormsOverview';
import { RedirectsOverview } from '@/components/dashboard/RedirectsOverview';
import { FunnelChart } from '@/components/dashboard/FunnelChart';
import { EventTypeChart } from '@/components/dashboard/EventTypeChart';
import { RealtimeFeed } from '@/components/dashboard/RealtimeFeed';
import { DataManagement } from '@/components/dashboard/DataManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Dashboard | wlo-slt' };

export default async function DashboardPage() {
  let stats, events, submissions, links;
  try {
    [stats, events, submissions, links] = await Promise.all([
      getStats(),
      getEvents(10),
      getSubmissions(10),
      getShortLinks(),
    ]);
  } catch (e: any) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📊 Simple Lead Tracker</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader><CardTitle className="text-red-700">Supabase no configurado</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-3">
              Configura estas variables de entorno en Vercel (Project Settings → Environment Variables):
            </p>
            <code className="block rounded bg-red-100 px-2 py-1 text-xs text-red-800">
              NEXT_PUBLIC_SUPABASE_URL<br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY<br />
              SUPABASE_SERVICE_ROLE_KEY
            </code>
            <p className="mt-3 text-sm text-red-600">
              {e?.message || 'Error al conectar con Supabase'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📊 Simple Lead Tracker</h1>
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

      <DataManagement />
    </div>
  );
}
