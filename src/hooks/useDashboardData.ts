import { useCallback, useState } from 'react';

const TABLES = ['events', 'sessions', 'form_submissions', 'short_links', 'forms', 'ip_rules'];
const EXPORT_TYPES = ['events', 'submissions', 'forms', 'short_links'];
const IMPORT_TYPES = ['events', 'submissions', 'short_links'];

export { TABLES, EXPORT_TYPES, IMPORT_TYPES };

export interface ClearResult { count: number; mode: 'supabase' | 'demo'; }
export interface ImportResult { imported: number; errors: string[]; }

export function useDashboardData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(async (table: string): Promise<ClearResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/data?action=clear&table=${encodeURIComponent(table)}`, { method: 'POST' });
      const text = await res.text();
      const data: ClearResult & { message?: string } = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.message || `No se pudo limpiar ${table}`);
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportData = useCallback(async (type: string, format: 'json' | 'csv' = 'json'): Promise<any | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/data?action=export&type=${encodeURIComponent(type)}&format=${encodeURIComponent(format)}`);
      if (format === 'csv') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-export.csv`;
        a.click();
        URL.revokeObjectURL(url);
        return { downloaded: true };
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `No se pudo exportar ${type}`);
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchEvents = useCallback(async (opts: { url?: string; type?: string; limit?: number }): Promise<any[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ action: 'search' });
      if (opts.url) q.set('url', opts.url);
      if (opts.type) q.set('type', opts.type);
      if (opts.limit) q.set('limit', String(opts.limit));
      const res = await fetch(`/api/dashboard/data?${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudo buscar');
      return data.rows ?? [];
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const importRows = useCallback(async (type: string, rows: any[]): Promise<ImportResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/data?action=import&type=${encodeURIComponent(type)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data: ImportResult & { message?: string } = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudo importar');
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, clear, exportData, searchEvents, importRows };
}
