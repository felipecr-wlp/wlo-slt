'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardData, TABLES, EXPORT_TYPES, IMPORT_TYPES } from '@/hooks/useDashboardData';
import type { EventRow } from '@slt/shared-types';

const TABS = ['clear', 'export', 'search', 'import'] as const;
type Tab = (typeof TABS)[number];

export function DataManagement() {
  const { loading, error, clear, exportData, searchEvents, importRows } = useDashboardData();
  const [tab, setTab] = useState<Tab>('clear');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearTable, setClearTable] = useState('events');
  const [search, setSearch] = useState<{ url: string; type: string; limit: string }>({ url: '', type: '', limit: '50' });
  const [searchResults, setSearchResults] = useState<EventRow[]>([]);
  const [importType, setImportType] = useState('events');
  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState('');

  async function doClear() {
    setConfirmOpen(false);
    const res = await clear(clearTable);
    if (res) alert(`Limpiado ${res.mode}: ${res.count} fila(s) de ${clearTable}`);
  }

  async function doExport() {
    const blob = await exportData(importType, 'json');
    if (blob?.rows) {
      const a = document.createElement('a');
      a.href = `data:application/json,${encodeURIComponent(JSON.stringify(blob.rows, null, 2))}`;
      a.download = `${importType}-export.json`;
      a.click();
    }
  }

  async function doCsv() {
    await exportData(importType, 'csv');
  }

  async function doSearch() {
    const rows = await searchEvents({
      url: search.url || undefined,
      type: search.type || undefined,
      limit: search.limit ? Number(search.limit) : undefined,
    });
    if (rows) setSearchResults(rows);
  }

  async function doImport() {
    let rows: any[];
    const file = fileRef.current?.files?.[0];
    if (file) {
      const text = await file.text();
      try { rows = JSON.parse(text); } catch { rows = []; }
    } else if (importText.trim()) {
      try { rows = JSON.parse(importText); } catch { rows = []; }
    } else {
      alert('Selecciona un archivo o pega JSON.'); return;
    }
    if (!Array.isArray(rows)) {
      alert('El JSON debe ser un arreglo de objetos.'); return;
    }
    const res = await importRows(importType, rows);
    if (res) alert(`Importados ${res.imported}/${rows.length}. Errores: ${res.errors.length}`);
  }

  return (
    <Card className="mt-4 bg-transparent border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
      <CardHeader>
        <CardTitle>Gestión de datos</CardTitle>
        <div className="flex gap-1 flex-wrap">
          {TABS.map((t) => (
              <Button variant={tab === t ? 'default' : 'outline'} onClick={() => setTab(t)}>
              {t}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        {loading && <p className="text-sm text-gray-500 mb-2">Procesando...</p>}

        {tab === 'clear' && (
          <div className="space-y-3">
            <div>
              <Label>Tabla</Label>
              <select value={clearTable} onChange={(e) => setClearTable(e.target.value)} className="w-full border rounded p-1 text-gray-900 bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
                {TABLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={loading}>
              Limpiar {clearTable}
            </Button>
            {confirmOpen && (
              <div className="p-3 border rounded bg-gray-50">
                <p>¿Seguro? Se borrarán todos los registros de <b>{clearTable}</b>.</p>
                <div className="flex gap-2 mt-2">
                  <Button variant="destructive" onClick={doClear}>Confirmar y limpiar</Button>
                  <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {(tab === 'export' || tab === 'import') && (
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <select value={importType} onChange={(e) => setImportType(e.target.value)} className="w-full border rounded p-1 text-gray-900 bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
                {(tab === 'export' ? EXPORT_TYPES : IMPORT_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {tab === 'export' && (
              <div className="flex gap-2">
                <Button onClick={doExport} disabled={loading}>Exportar JSON</Button>
                <Button variant="outline" onClick={doCsv} disabled={loading}>Exportar CSV</Button>
              </div>
            )}
            {tab === 'import' && (
              <div className="space-y-3">
                <div>
                  <Label>Archivo .json</Label>
                  <Input type="file" accept="application/json" ref={fileRef} />
                </div>
                <div>
                  <Label>o pega JSON (arreglo)</Label>
                  <Textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='[{"type":"pageview","url":"https://...","session_id":"..."}]' />
                </div>
                <Button variant="default" onClick={doImport} disabled={loading}>Importar</Button>
              </div>
            )}
          </div>
        )}

        {tab === 'search' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="url parcial" value={search.url} onChange={(e) => setSearch({ ...search, url: e.target.value })} />
              <Input placeholder="tipo" value={search.type} onChange={(e) => setSearch({ ...search, type: e.target.value })} />
              <Input type="number" placeholder="límite" value={search.limit} onChange={(e) => setSearch({ ...search, limit: e.target.value })} />
            </div>
            <Button onClick={doSearch} disabled={loading}>Buscar</Button>
            {searchResults.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left">id</th><th className="text-left">tipo</th><th className="text-left">url</th><th className="text-left">fecha</th></tr></thead>
                  <tbody>
                    {searchResults.map((e) => (
                      <tr key={e.id}>
                        <td className="font-mono text-xs">{e.id.slice(0, 8)}</td>
                        <td>{e.event_type}</td>
                        <td className="max-w-xs truncate">{e.url}</td>
                        <td>{e.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
