'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { EventRow } from '@slt/shared-types';

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 50;

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/dashboard/events?limit=500`, { cache: 'no-store' });
      if (r.ok) setEvents(await r.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const types = useMemo(() => Array.from(new Set(events.map((e) => e.event_type))), [events]);

  const filtered = useMemo(() => {
    let result = events;

    if (typeFilter !== 'all') {
      result = result.filter((e) => e.event_type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => {
        const p = e.payload as any;
        const haystack = [
          e.url, e.event_type, e.element_id, e.session_id, e.device_type,
          p?.user_email, p?.user_name, p?.user_phone, p?.observaciones,
          p?.session_id, p?.source, p?.site, p?.fingerprint,
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    if (dateFrom) {
      result = result.filter((e) => new Date(e.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((e) => new Date(e.created_at) <= to);
    }

    return result;
  }, [events, typeFilter, search, dateFrom, dateTo]);

  const paged = filtered.slice(page * limit, (page + 1) * limit);
  const totalPages = Math.ceil(filtered.length / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <Button onClick={load} disabled={loading}>Actualizar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros y búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Buscar</label>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Email, nombre, URL, session_id, source..."
                className="w-full border rounded p-2 text-gray-900 bg-white mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo de evento</label>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                className="w-full border rounded p-2 text-gray-900 bg-white mt-1"
              >
                <option value="all">Todos</option>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Desde</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                  className="w-full border rounded p-2 text-gray-900 bg-white mt-1"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Hasta</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                  className="w-full border rounded p-2 text-gray-900 bg-white mt-1"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{filtered.length} resultado(s)</p>
            {(search || typeFilter !== 'all' || dateFrom || dateTo) && (
              <Button variant="outline" onClick={() => { setSearch(''); setTypeFilter('all'); setDateFrom(''); setDateTo(''); setPage(0); }}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabla de eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && events.length === 0 ? (
            <p className="text-sm text-gray-500 py-6">Cargando...</p>
          ) : paged.length === 0 ? (
            <p className="text-sm text-gray-500 py-6">No hay eventos que coincidan con los filtros.</p>
          ) : (
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
                  {paged.map((e) => (
                    <>
                      <tr key={e.id} className="border-b cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                        <td className="px-3 py-2">
                          <Badge variant="outline">{e.event_type}</Badge>
                        </td>
                        <td className="px-3 py-2 max-w-xs truncate">{e.url}</td>
                        <td className="px-3 py-2">{e.element_id || '-'}</td>
                        <td className="px-3 py-2">{e.device_type || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {new Date(e.created_at).toLocaleString('es-MX')}
                        </td>
                      </tr>
                      {expanded === e.id && (
                        <tr key={`${e.id}-payload`}>
                          <td colSpan={5} className="px-3 py-2 bg-gray-50">
                            <p className="text-xs font-medium text-gray-500 mb-1">Payload completo:</p>
                            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all max-h-64 overflow-auto">
                              {JSON.stringify(e.payload || e, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-sm text-gray-500 py-2">Página {page + 1} de {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      )}
    </div>
  );
}
