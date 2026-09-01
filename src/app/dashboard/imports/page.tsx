'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LogEntry {
  id: string;
  integration: string;
  status: string;
  request_payload: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
}

export default function ImportsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const limit = 50;

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
    if (filter !== 'all') params.set('integration', filter);
    const r = await fetch(`/api/logs?${params}`);
    if (r.ok) {
      const d = await r.json();
      setLogs(d);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter, page]);

  const getTipo = (log: LogEntry): string => {
    const p = log.request_payload as any;
    return p?.tipo || p?.event || p?._normalized?.eventType || log.integration;
  };

  const getResumen = (log: LogEntry): string => {
    const p = log.request_payload as any;
    if (p?.tipo === 'evento') return p?.user_email || p?.user_name || p?.url_pagina || '-';
    if (p?.tipo === 'redirect') return `/${p?.slug || ''} → ${p?.destino || ''}`;
    if (p?.tipo === 'webhook') return p?.source || '-';
    if (p?.tipo === 'test_connection') return 'Test OK';
    if (p?.source === 'wordpress') return p?.fields?.email || p?.fields?.name || '-';
    return p?.email || p?.name || '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Importaciones / Activity Log</h1>
        <Button onClick={load} disabled={loading}>Actualizar</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'wordpress', 'slt', 'wordpress_webhook', 'webhook'].map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} onClick={() => { setFilter(f); setPage(0); }}>
            {f === 'all' ? 'Todos' : f}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500">
            No hay importaciones registradas. Los datos aparecerán cuando envíes información desde WordPress o uses el endpoint de webhooks.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                      <Badge variant="outline">{getTipo(log)}</Badge>
                      <span className="text-xs text-gray-500">{log.integration}</span>
                    </div>
                    <p className="text-sm truncate">{getResumen(log)}</p>
                    {log.error_message && (
                      <p className="text-xs text-red-600">{log.error_message}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('es-MX')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-2">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
        <span className="text-sm text-gray-500 py-2">Página {page + 1}</span>
        <Button variant="outline" disabled={logs.length < limit} onClick={() => setPage(page + 1)}>Siguiente</Button>
      </div>
    </div>
  );
}
