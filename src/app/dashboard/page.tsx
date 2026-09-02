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

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard | wlo-slt' };

export default async function DashboardPage() {
  let stats = null;
  let events: any[] = [];
  let submissions: any[] = [];
  let links: any[] = [];
  let errors: string[] = [];

  // Cada query es independiente — si una falla, las demás siguen
  try { stats = await getStats(); } catch (e: any) { errors.push(`stats: ${e?.message || e}`); }
  try { events = await getEvents(10); } catch (e: any) { errors.push(`events: ${e?.message || e}`); }
  try { submissions = await getSubmissions(10); } catch (e: any) { errors.push(`submissions: ${e?.message || e}`); }
  try { links = await getShortLinks(); } catch (e: any) { errors.push(`links: ${e?.message || e}`); }

  const safeStats = stats || { events: 0, sessions: 0, forms: 0, submissions: 0, redirects: 0, bounceRate: 0, avgSessionSec: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📊 Simple Lead Tracker</h1>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <p className="font-medium">Errores al cargar datos:</p>
          <ul className="list-disc pl-5 mt-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <StatsCards stats={safeStats} />

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
