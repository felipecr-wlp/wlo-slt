// Capa de datos server-side. Demo-safe: usa Supabase cuando las env están
// configuradas, si no retorna mock data. Nunca lanza → el dashboard siempre renderiza.
import { getSupabaseAdmin } from './supabase-admin';
import { z } from 'zod';
import { MOCK_STATS,
  MOCK_EVENTS,
  MOCK_FORMS,
  MOCK_SUBMISSIONS,
  MOCK_SHORTLINKS,
  MOCK_FUNNELS,
  MOCK_EVENTS_BY_TYPE,
  MOCK_IP_RULES,
  MOCK_INTEGRATIONS,
} from './mockData';
import { getRecentSubmissions, listForms, getForm, addSubmission, addSubmissions, clearSubmissions } from './demoStore';
import { getRecentEvents, clearEvents, addEvent } from './ingestBuffer';
import { trackEventSchema, shortLinkSchema } from './validators';
import type { EventRow, FormSubmission, ShortLink, Form } from '@slt/shared-types';

function sb() {
  try {
    return getSupabaseAdmin();
  } catch {
    return null;
  }
}

export async function getStats(): Promise<typeof MOCK_STATS> {
  const client = sb();
  if (!client) return MOCK_STATS;
  try {
    const [events, sessions, forms, submissions, redirects] = await Promise.all([
      client.from('events').select('*', { count: 'exact', head: true }),
      client.from('sessions').select('*', { count: 'exact', head: true }),
      client.from('forms').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      client.from('form_submissions').select('*', { count: 'exact', head: true }),
      client.from('short_links').select('*', { count: 'exact', head: true }),
    ]);
    return {
      events: events.count ?? 0,
      sessions: sessions.count ?? 0,
      forms: forms.count ?? 0,
      submissions: submissions.count ?? 0,
      redirects: redirects.count ?? 0,
      bounceRate: 54,
      avgSessionSec: 186,
    };
  } catch {
    return MOCK_STATS;
  }
}

export async function getEvents(limit = 50): Promise<EventRow[]> {
  const client = sb();
  if (!client) return MOCK_EVENTS.slice(0, limit);
  try {
    const { data, error } = await client
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return MOCK_EVENTS.slice(0, limit);
    return data as EventRow[];
  } catch {
    return MOCK_EVENTS.slice(0, limit);
  }
}

export async function getForms(): Promise<Form[]> {
  const client = sb();
  if (!client) {
    const m = new Map(MOCK_FORMS.map((f) => [f.id, f]));
    for (const f of listForms()) m.set(f.id, f);
    return Array.from(m.values());
  }
  try {
    const { data, error } = await client
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      const m = new Map(MOCK_FORMS.map((f) => [f.id, f]));
      for (const f of listForms()) m.set(f.id, f);
      return Array.from(m.values());
    }
    return data as Form[];
  } catch {
    const m = new Map(MOCK_FORMS.map((f) => [f.id, f]));
    for (const f of listForms()) m.set(f.id, f);
    return Array.from(m.values());
  }
}

export async function getFormById(id: string): Promise<Form | null> {
  const client = sb();
  const notFound = (def: Form | null) =>
    getForm(id) ?? MOCK_FORMS.find((f) => f.id === id) ?? def ?? null;
  if (!client) return notFound(null);
  try {
    const { data, error } = await client.from('forms').select('*').eq('id', id).single();
    if (error) return notFound(null);
    return data as Form;
  } catch {
    return notFound(null);
  }
}

export async function getSubmissions(limit = 50): Promise<FormSubmission[]> {
  const client = sb();
  if (!client) {
    return [...getRecentSubmissions(limit), ...MOCK_SUBMISSIONS].slice(0, limit);
  }
  try {
    const { data, error } = await client
      .from('form_submissions')
      .select('*, forms(title)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [...getRecentSubmissions(limit), ...MOCK_SUBMISSIONS].slice(0, limit);
    return data as unknown as FormSubmission[];
  } catch {
    return [...getRecentSubmissions(limit), ...MOCK_SUBMISSIONS].slice(0, limit);
  }
}

export async function getShortLinks(): Promise<ShortLink[]> {
  const client = sb();
  if (!client) return MOCK_SHORTLINKS;
  try {
    const { data, error } = await client.from('short_links').select('*').order('created_at', { ascending: false });
    if (error) return MOCK_SHORTLINKS;
    return data as ShortLink[];
  } catch {
    return MOCK_SHORTLINKS;
  }
}

export async function getShortLinkBySlug(slug: string): Promise<ShortLink | null> {
  const client = sb();
  if (!client) return MOCK_SHORTLINKS.find((l) => l.slug === slug) ?? null;
  try {
    const { data, error } = await client.from('short_links').select('*').eq('slug', slug).single();
    if (error) return MOCK_SHORTLINKS.find((l) => l.slug === slug) ?? null;
    return data as ShortLink;
  } catch {
    return MOCK_SHORTLINKS.find((l) => l.slug === slug) ?? null;
  }
}

export async function getFunnels() {
  const client = sb();
  if (!client) return MOCK_FUNNELS;
  try {
    const { data, error } = await client.from('events').select('event_type, created_at');
    if (error) return MOCK_FUNNELS;
    return data;
  } catch {
    return MOCK_FUNNELS;
  }
}

export function getEventsByType() {
  return MOCK_EVENTS_BY_TYPE;
}

export function getIpRules() {
  return MOCK_IP_RULES;
}

export function getIntegrations() {
  return MOCK_INTEGRATIONS;
}

function toEventRow(e: { id: string; session_id: string; type: string; element_id?: string; url: string; referrer?: string; country?: string; device_type?: string; timestamp?: string }): EventRow {
  return {
    id: e.id,
    session_id: e.session_id,
    event_type: e.type,
    element_id: e.element_id || undefined,
    url: e.url,
    referrer: e.referrer || undefined,
    country: e.country || undefined,
    device_type: e.device_type || undefined,
    created_at: e.timestamp || new Date().toISOString(),
  };
}

export async function searchEvents(filter: { url?: string; type?: string; limit?: number }): Promise<EventRow[]> {
  const limit = filter.limit ?? 50;
  const client = sb();
  if (!client) {
    return getRecentEvents(limit * 8).map(toEventRow).filter((e) => {
      if (filter.url && !(e.url || '').toLowerCase().includes(filter.url!.toLowerCase())) return false;
      if (filter.type && e.event_type !== filter.type) return false;
      return true;
    }).slice(0, limit);
  }
  try {
    let q = client.from('events').select('id,session_id,event_type,element_id,url,referrer,country,city,device_type,created_at');
    if (filter.url) q = (q as any).ilike('url', `%${filter.url}%`);
    if (filter.type) q = (q as any).eq('event_type', filter.type);
    const { data, error } = await q.order('created_at', { ascending: false }).limit(limit);
    if (error) return [];
    return (data ?? []) as EventRow[];
  } catch {
    return [];
  }
}

const CLEARABLE = ['events', 'sessions', 'form_submissions', 'short_links', 'forms', 'ip_rules'];
export async function clearDataTable(table: string): Promise<{ count: number; mode: 'supabase' | 'demo' }> {
  if (!CLEARABLE.includes(table)) throw new Error(`table not allowed: ${table}`);
  const client = sb();
  if (!client) {
    if (table === 'events') { const n = clearEvents(); return { count: n, mode: 'demo' }; }
    if (table === 'form_submissions') { const n = clearSubmissions(); return { count: n, mode: 'demo' }; }
    return { count: 0, mode: 'demo' };
  }
  const { data, error } = await client.from(table).select('id');
  if (error) throw error;
  const ids = (data ?? []).map((r: any) => r.id);
  if (ids.length === 0) return { count: 0, mode: 'supabase' };
  const { error: de } = await client.from(table).delete().in('id', ids);
  if (de) throw de;
  return { count: ids.length, mode: 'supabase' };
}

export async function exportTable(type: 'events' | 'submissions' | 'forms' | 'short_links'): Promise<{ rows: any[]; format: string; count: number }> {
  let rows: any[];
  if (type === 'events') rows = await getEvents(1000);
  else if (type === 'submissions') rows = await getSubmissions(1000);
  else if (type === 'forms') rows = await getForms();
  else rows = await getShortLinks();
  return { rows, format: 'json', count: rows.length };
}

export function toCsv(rows: any[]): string {
  if (!rows?.length) return '';
  const cols = Array.from(new Set(rows.flatMap((r) => (r ? Object.keys(r) : []))));
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  return [cols.map(esc).join(','), ...rows.map((r) => cols.map((c) => esc((r as any)?.[c])).join(','))].join('\r\n');
}

const importEventSchema = z.object({
  type: trackEventSchema.shape.type,
  url: trackEventSchema.shape.url,
  session_id: z.string().optional(),
  fingerprint: z.string().optional(),
  site_id: z.string().optional(),
  event_name: z.string().optional(),
  element_id: z.string().optional(),
  referrer: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  gclid: z.string().optional(),
  fbclid: z.string().optional(),
  device_type: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  screen_res: z.string().optional(),
  cores: z.number().int().optional(),
  memory_gb: z.number().int().optional(),
  connection_type: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
  timestamp: z.string().min(1).optional(),
});

export async function importRows(type: 'events' | 'submissions' | 'short_links', rows: any[]): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;
  const client = sb();
  if (!client) {
    for (const r of rows) {
      try {
        if (type === 'events') {
          const parsed = importEventSchema.parse(r);
          const e = { ...parsed, url: parsed.url };
          addEvent(e as any);
        } else if (type === 'submissions') {
          addSubmission(r as FormSubmission);
        } else if (type === 'short_links') {
          shortLinkSchema.parse(r);
        }
        imported++;
      } catch (e: any) {
        errors.push(e?.message || String(e));
      }
    }
    return { imported, errors };
  }
  for (const r of rows) {
    try {
      let tbl: string; let payload: any;
      if (type === 'events') {
        tbl = 'events';
        const parsed = importEventSchema.parse(r);
        payload = {
          session_id: parsed.session_id ?? '', event_type: parsed.type, element_id: parsed.element_id,
          url: parsed.url, referrer: parsed.referrer, country: parsed.country, device_type: parsed.device_type,
          created_at: parsed.timestamp || new Date().toISOString(), payload: parsed.payload ?? {},
        };
      } else if (type === 'submissions') {
        tbl = 'form_submissions';
        payload = r;
      } else {
        tbl = 'short_links';
        const p = shortLinkSchema.safeParse(r);
        if (!p.success) throw new Error(p.error.message);
        payload = { id: p.data.id, name: p.data.name, slug: p.data.slug, target_url: p.data.target_url, plataforma: p.data.plataforma };
      }
      const { error } = await client.from(tbl).insert(payload);
      if (error) throw error;
      imported++;
    } catch (e: any) {
      errors.push(e?.message || String(e));
    }
  }
  return { imported, errors };
}
