// Eventos de tracking capturados por tracker.js y enviados a /api/ingest
export interface TrackEvent {
  site_id: string;
  session_id: string;
  fingerprint: string;
  type: 'pageview' | 'form_submit' | 'click' | 'scroll' | 'conversion' | 'copy' | 'custom' | 'session_start' | 'session_end';
  event_name?: string;
  element_id?: string;
  url: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  screen_res?: string;
  cores?: number;
  memory_gb?: number;
  connection_type?: string;
  country?: string;
  city?: string;
  payload: Record<string, unknown>;
  timestamp: string; // ISO
}

export interface SiteConfig {
  endpoint: string;
  siteId: string;
  debug?: boolean;
  autoTrackForms?: boolean;
  autoTrackClicks?: boolean;
  autoTrackScroll?: boolean;
  respectDNT?: boolean;
}

export interface LeadPayload {
  name?: string;
  email?: string;
  phone?: string;
  custom?: Record<string, unknown>;
}

export interface FormField {
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'hidden';
  label: string;
  name: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  pd_key?: string;
}

export interface FormRouting {
  pipedrive?: unknown;
  clickup?: unknown;
  supabase?: unknown;
  gsheets?: unknown;
  wli?: unknown;
  esp?: unknown;
  email_notify?: boolean;
  email_to?: string;
  email_cc?: string;
  email_subject?: string;
  email_body?: string;
  action_type?: 'message' | 'redirect';
  redirect_url?: string;
}

export interface Form {
  id: string;
  title: string;
  page_url?: string;
  fields: FormField[];
  routing: FormRouting;
  action_type: 'message' | 'redirect';
  redirect_url?: string;
  txt_submit?: string;
  txt_success?: string;
  txt_error?: string;
  txt_next?: string;
  txt_prev?: string;
  colors?: Record<string, unknown>;
  rules?: unknown[];
  status: 'active' | 'archived';
  group_name: string;
  created_at: string;
  updated_at: string;
}

export interface ShortLink {
  id: string;
  name: string;
  slug: string;
  target_url: string;
  plataforma: string;
  clicks: number;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  session_id: string;
  event_type: string;
  element_id?: string;
  url: string;
  referrer?: string;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  fingerprint?: string;
  payload?: Record<string, unknown>;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  session_id?: string;
  data: Record<string, unknown>;
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
  status: 'new' | 'synced' | 'error';
  created_at: string;
  form?: { title: string };
}
