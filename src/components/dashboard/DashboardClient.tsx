'use client';

import { useState, useEffect, useCallback } from 'react';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { EventsTable } from '@/components/dashboard/EventsTable';
import { FormsOverview } from '@/components/dashboard/FormsOverview';
import { RedirectsOverview } from '@/components/dashboard/RedirectsOverview';
import { FunnelChart } from '@/components/dashboard/FunnelChart';
import { EventTypeChart } from '@/components/dashboard/EventTypeChart';
import { RealtimeFeed } from '@/components/dashboard/RealtimeFeed';
import { DataManagement } from '@/components/dashboard/DataManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardClient() {
  const [stats, setStats] = useState({ events: 0, sessions: 0, forms: 0, submissions: 0, redirects: 0, bounceRate: 0, avgSessionSec: 0 });
  const [events, setEvents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    const errs: string[] = [];
    try {
      const r = await fetch('/api/dashboard/stats', { cache: 'no-store' });
      if (r.ok) setStats(await r.json());
    } catch (e: any) { errs.push(`stats: ${e?.message}`); }

    try {
      const r = await fetch('/api/dashboard/events?limit=10', { cache: 'no-store' });
      if (r.ok) setEvents(await r.json());
    } catch (e: any) { errs.push(`events: ${e?.message}`); }

    try {
      const r = await fetch('/api/dashboard/submissions?limit=10', { cache: 'no-store' });
      if (r.ok) setSubmissions(await r.json());
    } catch (e: any) { errs.push(`submissions: ${e?.message}`); }

    try {
      const r = await fetch('/api/dashboard/links', { cache: 'no-store' });
      if (r.ok) setLinks(await r.json());
    } catch (e: any) { errs.push(`links: ${e?.message}`); }

    setErrors(errs);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📊 Simple Lead Tracker</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Último refresh: {lastRefresh.toLocaleTimeString('es-MX')}</span>
          <button onClick={loadData} className="text-xs text-blue-600 hover:underline">Actualizar ahora</button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <p className="font-medium">Errores al cargar datos:</p>
          <ul className="list-disc pl-5 mt-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

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
