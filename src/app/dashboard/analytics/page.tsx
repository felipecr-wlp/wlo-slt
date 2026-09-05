'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FolderUrl { url: string; match: 'exact' | 'starts_with' }
interface Folder { id: string; name: string; color: string; launch_date: string; urls: FolderUrl[] }
interface UrlMetrics { url_pagina: string; visitantes: number; eventos: number; conversiones: number; entradas: number }
interface Lead { session_id: string; user_name: string; user_email: string; user_phone: string; user_ip: string; elemento_id: string; url_pagina: string; observaciones: string; fecha: string; fingerprint: string; user_profile: string }

function today() { return new Date().toISOString().split('T')[0]; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
function fmtDateTime(s: string) { return new Date(s).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
function rate(c: number, e: number) { return e > 0 ? Math.round((c / e) * 10000) / 100 : 0; }
function rateBadge(r: number, e: number) {
  if (e === 0 && r === 0) return { bg: '#fee2e2', color: '#991b1b', label: '—' };
  if (r >= 10) return { bg: '#dcfce7', color: '#166534', label: `${r}%` };
  if (r >= 3) return { bg: '#fef3c7', color: '#92400e', label: `${r}%` };
  return { bg: '#f3f4f6', color: '#4b5563', label: `${r}%` };
}
function extractEmail(row: any): string {
  if (row.user_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.user_email)) return row.user_email.toLowerCase().trim();
  if (row.user_name && !row.user_name.includes('Anónimo')) {
    if (row.user_name.includes('|')) { const e = row.user_name.split('|')[1]?.trim(); if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return e.toLowerCase(); }
    else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.user_name.trim())) return row.user_name.trim().toLowerCase();
  }
  if (row.observaciones) { const m = row.observaciones.match(/Email:\s*([^,\s<]+)/i); if (m && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m[1].trim())) return m[1].trim().toLowerCase(); }
  return '';
}
function extractName(row: any): string {
  if (row.user_name && !row.user_name.includes('Anónimo')) {
    if (row.user_name.includes('|')) return row.user_name.split('|')[0].trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.user_name.trim())) return row.user_name.trim();
  }
  if (row.observaciones) { const m = row.observaciones.match(/Nombre:\s*([^,\n]+)/i); if (m) return m[1].trim(); }
  return '';
}
function parseSession(sid: string) {
  const parts = sid.split('|');
  return { ciudad: parts[0]?.trim() || '—', ip: parts[2]?.replace('IP:', '').trim() || '—' };
}

export default function AnalyticsPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [metrics, setMetrics] = useState<UrlMetrics[]>([]);
  const [globalStart, setGlobalStart] = useState('');
  const [globalEnd, setGlobalEnd] = useState('');
  const [viewUrl, setViewUrl] = useState('');
  const [viewMatch, setViewMatch] = useState<'exact' | 'starts_with'>('exact');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsStart, setLeadsStart] = useState(daysAgo(30));
  const [leadsEnd, setLeadsEnd] = useState(today());
  const [configOpen, setConfigOpen] = useState(false);
  const [openFolders, setOpenFolders] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [configFolders, setConfigFolders] = useState<Folder[]>([]);

  // Read URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('fecha_inicio')) setGlobalStart(params.get('fecha_inicio')!);
    if (params.get('fecha_fin')) setGlobalEnd(params.get('fecha_fin')!);
    if (params.get('view_url')) { setViewUrl(params.get('view_url')!); setViewMatch((params.get('match') as any) || 'exact'); }
    if (params.get('detail_start')) setLeadsStart(params.get('detail_start')!);
    if (params.get('detail_end')) setLeadsEnd(params.get('detail_end')!);
  }, []);

  const loadFolders = useCallback(async () => {
    const r = await fetch('/api/folders', { cache: 'no-store' });
    const d = await r.json();
    setFolders(d.folders || []);
    setConfigFolders(d.folders || []);
  }, []);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (globalStart) params.set('start', globalStart);
    if (globalEnd) params.set('end', globalEnd);
    const r = await fetch(`/api/analytics/metrics?${params}`, { cache: 'no-store' });
    const d = await r.json();
    setMetrics(d.metrics || []);
    setLoading(false);
  }, [globalStart, globalEnd]);

  const loadLeads = useCallback(async () => {
    if (!viewUrl) return;
    const params = new URLSearchParams({ url: viewUrl, start: leadsStart, end: leadsEnd, match: viewMatch });
    const r = await fetch(`/api/analytics/leads?${params}`, { cache: 'no-store' });
    const d = await r.json();
    setLeads(d.leads || []);
  }, [viewUrl, leadsStart, leadsEnd, viewMatch]);

  useEffect(() => { loadFolders(); }, [loadFolders]);
  useEffect(() => { loadMetrics(); }, [loadMetrics]);
  useEffect(() => { { loadLeads(); } }, [loadLeads]);

  // Index metrics by url
  const metricsIndex = useMemo(() => {
    const idx: Record<string, UrlMetrics> = {};
    metrics.forEach((m) => { idx[m.url_pagina.replace(/\/$/, '')] = m; });
    return idx;
  }, [metrics]);

  // Compute folder metrics
  const folderMetrics = useMemo(() => {
    return folders.map((folder) => {
      const agg = { visitantes: 0, eventos: 0, conversiones: 0, entradas: 0 };
      folder.urls.forEach((fu) => {
        const cleanUrl = fu.url.replace(/\/$/, '');
        if (fu.match === 'exact') {
          const m = metricsIndex[cleanUrl];
          if (m) { agg.visitantes += m.visitantes; agg.eventos += m.eventos; agg.conversiones += m.conversiones; agg.entradas += m.entradas; }
        } else {
          Object.entries(metricsIndex).forEach(([dbUrl, m]) => {
            if (dbUrl.startsWith(cleanUrl)) { agg.visitantes += m.visitantes; agg.eventos += m.eventos; agg.conversiones += m.conversiones; agg.entradas += m.entradas; }
          });
        }
      });
      return { ...folder, agg, tasa: rate(agg.conversiones, agg.entradas) };
    });
  }, [folders, metricsIndex]);

  // Global KPIs
  const globalKpis = useMemo(() => {
    const agg = { visitantes: 0, eventos: 0, conversiones: 0, entradas: 0 };
    folderMetrics.forEach((f) => { agg.visitantes += f.agg.visitantes; agg.eventos += f.agg.eventos; agg.conversiones += f.agg.conversiones; agg.entradas += f.agg.entradas; });
    return { ...agg, tasa: rate(agg.conversiones, agg.entradas) };
  }, [folderMetrics]);

  // Leads computed
  const leadsWithInfo = useMemo(() => leads.map((l) => ({
    ...l,
    name: extractName(l),
    email: extractEmail(l),
    session: parseSession(l.session_id),
    campaign: l.observaciones?.includes('Campaña:') ? l.observaciones.split('Campaña: ')[1]?.split('\n')[0]?.trim() : null,
  })), [leads]);

  const uniqueEmails = useMemo(() => {
    const s = new Set(leadsWithInfo.filter((l) => l.email).map((l) => l.email));
    return Array.from(s);
  }, [leadsWithInfo]);

  // Folder toggle
  const toggleFolder = (idx: number) => {
    setOpenFolders((prev) => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  };

  // Date range helpers
  const setRange = (days: number) => {
    setGlobalStart(days === 0 ? today() : daysAgo(days));
    setGlobalEnd(today());
  };
  const setMonthStart = () => { const n = new Date(); setGlobalStart(new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split('T')[0]); setGlobalEnd(today()); };
  const setPrevMonth = () => { const n = new Date(); n.setDate(0); setGlobalStart(new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split('T')[0]); setGlobalEnd(n.toISOString().split('T')[0]); };
  const clearRange = () => { setGlobalStart(''); setGlobalEnd(''); };

  const setDetailRange = (days: number) => {
    setLeadsStart(days === 0 ? today() : daysAgo(days));
    setLeadsEnd(today());
  };

  // Navigate
  const goToLeads = (url: string, match: string) => { setViewUrl(url); setViewMatch(match as any); setLeadsStart(daysAgo(30)); setLeadsEnd(today()); };
  const goBack = () => { setViewUrl(''); setLeads([]); };

  // Save folders
  const saveFolders = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const r = await fetch('/api/folders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folders: configFolders }) });
      const d = await r.json();
      if (!r.ok || d.error) {
        setSaveMsg('❌ Error: ' + (d.error || 'Error desconocido'));
      } else {
        setSaveMsg('✅ Guardado: ' + (d.count || 0) + ' carpeta(s)');
        await loadFolders();
      }
    } catch (e: any) {
      setSaveMsg('❌ Error de red: ' + e.message);
    }
    setSaving(false);
  };

  // Config helpers
  const addFolder = () => { setConfigFolders([...configFolders, { id: crypto.randomUUID(), name: '', color: '#2271b1', launch_date: today(), urls: [] }]); };
  const removeFolder = (idx: number) => { if (confirm('¿Eliminar esta carpeta?')) setConfigFolders(configFolders.filter((_, i) => i !== idx)); };
  const updateFolder = (idx: number, field: string, value: any) => { const c = [...configFolders]; (c[idx] as any)[field] = value; setConfigFolders(c); };
  const addUrlToFolder = (idx: number) => { const c = [...configFolders]; c[idx].urls.push({ url: '', match: 'exact' }); setConfigFolders(c); };
  const removeUrlFromFolder = (fIdx: number, uIdx: number) => { const c = [...configFolders]; c[fIdx].urls.splice(uIdx, 1); setConfigFolders(c); };
  const updateUrl = (fIdx: number, uIdx: number, field: string, value: any) => { const c = [...configFolders]; (c[fIdx].urls[uIdx] as any)[field] = value; setConfigFolders(c); };

  // ── DETAIL VIEW ──
  if (viewUrl) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Leads en:</h1>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{viewUrl}</code>
            <p className="text-sm text-gray-500 mt-1">{leadsWithInfo.length} registros — {fmtDate(leadsStart)} → {fmtDate(leadsEnd)}</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {['Hoy', '7d', '30d', '90d'].map((l, i) => (
              <Button key={l} variant="outline" onClick={() => setDetailRange(i === 0 ? 0 : [7, 30, 90][i - 1])}>{l}</Button>
            ))}
            <a href={`/api/analytics/export?url=${encodeURIComponent(viewUrl)}&start=${leadsStart}&end=${leadsEnd}&match=${viewMatch}`} className="inline-flex items-center gap-1 px-3 py-1 border rounded text-sm hover:bg-gray-50">📥 CSV</a>
            <Button variant="outline" onClick={goBack}>← Volver</Button>
          </div>
        </div>

        <Card>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Contacto</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Acción</th>
                <th className="px-3 py-2 text-left">Perfil</th>
                <th className="px-3 py-2 text-left">Detalles</th>
              </tr></thead>
              <tbody>
                {leadsWithInfo.map((l, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">{fmtDateTime(l.fecha)}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{l.name || '—'}</div>
                      <div className="text-xs text-gray-400">{l.session.ciudad} · {l.session.ip}</div>
                    </td>
                    <td className="px-3 py-2">
                      {l.email ? <a href={`mailto:${l.email}`} className="text-blue-600 hover:underline">{l.email}</a> : '—'}
                    </td>
                    <td className="px-3 py-2"><Badge variant="outline">{l.elemento_id}</Badge></td>
                    <td className="px-3 py-2">
                      {l.user_profile && <Badge variant="secondary">{l.user_profile}</Badge>}
                      {l.fingerprint && <span className="text-xs text-gray-400 block">{l.fingerprint.substring(0, 16)}</span>}
                    </td>
                    <td className="px-3 py-2">
                      {l.campaign && <Badge variant="secondary" className="mb-1" style={{ background: '#e0e7ff', color: '#4338ca' }}>{l.campaign}</Badge>}
                      <span className="text-xs text-gray-500 block">{l.observaciones?.substring(0, 120) || '—'}</span>
                    </td>
                  </tr>
                ))}
                {leadsWithInfo.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">Sin leads en este rango</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── MAIN VIEW ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics por Carpetas y URLs</h1>
        <Button onClick={() => { setConfigFolders(folders); setConfigOpen(!configOpen); }}>
          {configOpen ? 'Cerrar config' : '⚙️ Configurar'}
        </Button>
      </div>

      {/* Config Panel */}
      {configOpen && (
        <Card>
          <CardHeader><CardTitle>Configurar Carpetas y URLs</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Agrupa tus URLs en carpetas. Cada carpeta suma las métricas de sus URLs.</p>
            {configFolders.map((f, fi) => (
              <div key={fi} className="border rounded p-4 space-y-3">
                <div className="flex gap-3 items-end flex-wrap">
                  <div><label className="text-xs font-medium">Color</label><input type="color" value={f.color} onChange={(e) => updateFolder(fi, 'color', e.target.value)} className="block w-10 h-8 mt-1" /></div>
                  <div><label className="text-xs font-medium">Fecha lanzamiento</label><input type="date" value={f.launch_date} onChange={(e) => updateFolder(fi, 'launch_date', e.target.value)} className="block border rounded p-1 mt-1 text-sm" /></div>
                  <div className="flex-1 min-w-[200px]"><label className="text-xs font-medium">Nombre</label><input type="text" value={f.name} onChange={(e) => updateFolder(fi, 'name', e.target.value)} className="block w-full border rounded p-1 mt-1 text-sm" placeholder="Nombre de carpeta" /></div>
                  <Button variant="destructive" onClick={() => removeFolder(fi)}>🗑️</Button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">URLs</label>
                  {f.urls.map((u, ui) => (
                    <div key={ui} className="flex gap-2 items-center">
                      <input type="text" value={u.url} onChange={(e) => updateUrl(fi, ui, 'url', e.target.value)} className="flex-1 border rounded p-1 text-sm" placeholder="https://tusitio.com/landing" />
                      <select value={u.match} onChange={(e) => updateUrl(fi, ui, 'match', e.target.value)} className="border rounded p-1 text-sm w-36">
                        <option value="exact">🎯 Exacta</option>
                        <option value="starts_with">🔍 Prefijo</option>
                      </select>
                      <button onClick={() => removeUrlFromFolder(fi, ui)} className="text-red-500 hover:text-red-700">✕</button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => addUrlToFolder(fi)}>+ Añadir URL</Button>
                  <p className="text-xs text-gray-400">🎯 Exacta = URL completa | 🔍 Prefijo = agrupa parámetros</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2 items-center">
              <Button variant="outline" onClick={addFolder}>+ Nueva Carpeta</Button>
              <Button onClick={saveFolders} disabled={saving}>{saving ? 'Guardando...' : '💾 Guardar Cambios'}</Button>
              {saveMsg && <span className="text-sm">{saveMsg}</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Visitantes" value={globalKpis.visitantes} border="#2271b1" />
        <KpiCard label="Eventos" value={globalKpis.eventos} border="#2271b1" />
        <KpiCard label="Conversiones" value={globalKpis.conversiones} border="#00a32a" />
        <KpiCard label="Tasa Global" value={`${globalKpis.tasa}%`} border="#2271b1" />
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap items-center p-3 bg-white border rounded-lg">
        <div className="flex gap-2 items-center">
          <label className="text-xs font-medium text-gray-500">Desde</label>
          <input type="date" value={globalStart} onChange={(e) => setGlobalStart(e.target.value)} className="border rounded p-1 text-sm" />
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs font-medium text-gray-500">Hasta</label>
          <input type="date" value={globalEnd} onChange={(e) => setGlobalEnd(e.target.value)} className="border rounded p-1 text-sm" />
        </div>
        <div className="flex gap-1">
          {['Hoy', '7d', '30d', '90d'].map((l, i) => (
            <Button key={l} variant="outline" onClick={() => setRange(i === 0 ? 0 : [7, 30, 90][i - 1])}>{l}</Button>
          ))}
          <Button variant="outline" onClick={setMonthStart}>Mes actual</Button>
          <Button variant="outline" onClick={setPrevMonth}>Mes anterior</Button>
          <Button variant="outline" onClick={clearRange}>✕ Limpiar</Button>
        </div>
      </div>

      {/* Folder Cards */}
      {loading ? (
        <p className="text-sm text-gray-500">Cargando métricas...</p>
      ) : folderMetrics.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-gray-500">No hay carpetas configuradas. Haz clic en ⚙️ Configurar para crear una.</CardContent></Card>
      ) : (
        folderMetrics.map((f, idx) => {
          const isOpen = openFolders.has(idx);
          const badge = rateBadge(f.tasa, f.agg.entradas);
          return (
            <div key={f.id} className={`bg-white border rounded-lg overflow-hidden ${isOpen ? '' : ''}`}>
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 select-none" onClick={() => toggleFolder(idx)}>
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: f.color }} />
                <span className="font-semibold text-sm">{f.name}</span>
                <span className="text-xs text-gray-400">📅 Desde: {fmtDate(f.launch_date)}</span>
                {globalStart && <span className="text-xs text-gray-400">→ {fmtDate(globalStart)} → {fmtDate(globalEnd || today())}</span>}
                <div className="flex gap-5 text-xs text-gray-500 ml-auto">
                  <span>👁️ {f.agg.visitantes} visitas</span>
                  <span>🎯 {f.agg.conversiones} conversiones</span>
                  <span>📥 {f.agg.entradas} entradas</span>
                  <span className="font-semibold px-2 py-0.5 rounded text-xs" style={{ background: badge.bg, color: badge.color }}>{badge.label} tasa</span>
                </div>
                <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
              </div>
              {isOpen && f.urls.length > 0 && (
                <div className="border-t">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-4 py-2 text-left">URL</th>
                      <th className="px-4 py-2 text-right">Visitas</th>
                      <th className="px-4 py-2 text-right">Entradas</th>
                      <th className="px-4 py-2 text-right">Conversiones</th>
                      <th className="px-4 py-2 text-right">Tasa</th>
                      <th className="px-4 py-2 text-left">Acciones</th>
                    </tr></thead>
                    <tbody>
                      {f.urls.map((fu, ui) => {
                        const cleanUrl = fu.url.replace(/\/$/, '');
                        let m: UrlMetrics | undefined;
                        if (fu.match === 'exact') { m = metricsIndex[cleanUrl]; }
                        else {
                          const agg = { url_pagina: fu.url, visitantes: 0, eventos: 0, conversiones: 0, entradas: 0 };
                          Object.entries(metricsIndex).forEach(([dbUrl, met]) => { if (dbUrl.startsWith(cleanUrl)) { agg.visitantes += met.visitantes; agg.eventos += met.eventos; agg.conversiones += met.conversiones; agg.entradas += met.entradas; } });
                          if (agg.eventos > 0) m = agg;
                        }
                        const v = m || { visitantes: 0, eventos: 0, conversiones: 0, entradas: 0 };
                        const r = rate(v.conversiones, v.entradas);
                        const rb = rateBadge(r, v.entradas);
                        return (
                          <tr key={ui} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 max-w-xs truncate">
                              <span className="font-mono">{fu.url}</span>
                              <Badge variant="outline" className="ml-2 text-[10px]">{fu.match === 'starts_with' ? '🔍 Prefijo' : '🎯 Exacta'}</Badge>
                            </td>
                            <td className="px-4 py-2 text-right">{v.visitantes}</td>
                            <td className="px-4 py-2 text-right">{v.entradas}</td>
                            <td className="px-4 py-2 text-right">{v.conversiones}</td>
                            <td className="px-4 py-2 text-right"><span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: rb.bg, color: rb.color }}>{rb.label}</span></td>
                            <td className="px-4 py-2">
                              <div className="flex gap-1">
                                <button onClick={() => goToLeads(fu.url, fu.match)} className="text-blue-600 hover:underline text-xs">👥 Ver Leads</button>
                                <a href={`/api/analytics/export?url=${encodeURIComponent(fu.url)}&start=${globalStart || daysAgo(365)}&end=${globalEnd || today()}&match=${fu.match}`} className="text-gray-500 hover:underline text-xs">📥 CSV</a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {isOpen && f.urls.length === 0 && (
                <div className="border-t px-4 py-4 text-center text-xs text-gray-400">Sin URLs configuradas. Ve a ⚙️ Configurar para agregar URLs.</div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function KpiCard({ label, value, border }: { label: string; value: string | number; border: string }) {
  return (
    <div className="bg-white border rounded-lg p-4" style={{ borderLeft: `4px solid ${border}` }}>
      <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
