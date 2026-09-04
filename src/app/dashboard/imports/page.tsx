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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmClean, setConfirmClean] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const limit = 50;

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
    if (filter !== 'all') params.set('integration', filter);
    params.set('exclude', 'test_connection');
    const r = await fetch(`/api/logs?${params}`);
    if (r.ok) {
      const d = await r.json();
      setLogs(d.data);
      setTotal(d.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter, page]);

  const doClean = async () => {
    setConfirmClean(false);
    setCleaning(true);
    try {
      const r = await fetch('/api/dashboard/data?action=clear&table=integration_logs', { method: 'POST' });
      const data = await r.json();
      if (r.ok) {
        alert(`Limpiado: ${data.count} registro(s) de importación`);
        load();
      } else {
        alert(`Error: ${data.message || 'No se pudo limpiar'}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
    setCleaning(false);
  };

  const p = (log: LogEntry) => log.request_payload as any;

  const getSite = (log: LogEntry): string => p(log)?.site || '-';

  const getTipo = (log: LogEntry): string => {
    const d = p(log);
    return d?.tipo || d?.event || d?._normalized?.eventType || log.integration;
  };

  const getSaved = (log: LogEntry): boolean | null => {
    const d = p(log);
    if (d?.saved === true) return true;
    if (d?.saved === false) return false;
    if (log.status === 'success') return true;
    if (log.status === 'error') return false;
    return null;
  };

  const getResumen = (log: LogEntry): string => {
    const d = p(log);
    if (d?.tipo === 'evento') return d?.user_email || d?.user_name || d?.url_pagina || '-';
    if (d?.tipo === 'bulk_eventos') return `${d?.count || 0} eventos`;
    if (d?.tipo === 'bulk_redirects') return `${d?.count || 0} redirects`;
    if (d?.tipo === 'bulk_webhooks') return `${d?.count || 0} webhooks`;
    if (d?.tipo === 'redirect') return `/${d?.slug || ''} → ${d?.destino || ''}`;
    if (d?.tipo === 'webhook') return d?.source || '-';
    if (d?.tipo === 'wli_tracking') return d?.user_email || '-';
    if (d?.source === 'wordpress') return d?.fields?.email || d?.fields?.name || '-';
    return d?.email || d?.name || '-';
  };

  const getObservaciones = (log: LogEntry): string | null => {
    const d = p(log);
    const parts: string[] = [];
    if (d?.observaciones) parts.push(d.observaciones);
    if (d?.reason) parts.push(`Error: ${d.reason}`);
    if (d?.code) parts.push(`Código: ${d.code}`);
    if (d?.table) parts.push(`Tabla: ${d.table}`);
    if (d?.skipped > 0) parts.push(`Saltados: ${d.skipped}`);
    if (log.error_message) parts.push(log.error_message);
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  const toggleExpand = (id: string) => setExpanded(expanded === id ? null : id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Importaciones / Activity Log</h1>
        <Button onClick={load} disabled={loading}>Actualizar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Limpiar registros de importación</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-3">
            Total de registros: <strong>{total}</strong>. Elimina todos los registros del activity log. No afecta eventos, redirects ni otros datos.
          </p>
          {confirmClean ? (
            <div className="flex gap-2">
              <Button variant="destructive" onClick={doClean} disabled={cleaning}>
                {cleaning ? 'Limpiando...' : 'Confirmar limpieza'}
              </Button>
              <Button variant="outline" onClick={() => setConfirmClean(false)}>Cancelar</Button>
            </div>
          ) : (
            <Button variant="destructive" onClick={() => setConfirmClean(true)} disabled={cleaning}>
              Limpiar importaciones
            </Button>
          )}
        </CardContent>
      </Card>

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
          {logs.map((log) => {
            const saved = getSaved(log);
            const obs = getObservaciones(log);
            const isOpen = expanded === log.id;
            return (
              <Card key={log.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleExpand(log.id)}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={saved === true ? 'default' : saved === false ? 'destructive' : 'secondary'}>
                          {saved === true ? 'Guardado' : saved === false ? 'No guardado' : log.status}
                        </Badge>
                        <Badge variant="outline">{getTipo(log)}</Badge>
                        {getSite(log) !== '-' && (
                          <Badge variant="secondary" className="font-mono text-xs">{getSite(log)}</Badge>
                        )}
                        <span className="text-xs text-gray-500">{log.integration}</span>
                      </div>
                      <p className="text-sm truncate">{getResumen(log)}</p>
                      {obs && (
                        <p className={`text-xs ${saved === false ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {obs}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-MX')}
                    </span>
                  </div>
                  {isOpen && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-all">{JSON.stringify(p(log), null, 2)}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
