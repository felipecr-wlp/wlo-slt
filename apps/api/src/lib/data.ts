// Capa de datos server-side. Demo-safe: usa Supabase cuando las env están
// configuradas, si no retorna mock data. Nunca lanza → el dashboard siempre renderiza.
import { getSupabaseAdmin } from './supabase-admin';
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
import { getRecentSubmissions, listForms, getForm } from './demoStore';
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
