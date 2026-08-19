import { z } from 'zod';

// Evento de tracking enviado por tracker.js → /api/ingest
export const trackEventSchema = z.object({
  site_id: z.string().min(1),
  session_id: z.string().min(1),
  fingerprint: z.string().min(1),
  type: z.enum(['pageview', 'form_submit', 'click', 'scroll', 'conversion', 'copy', 'custom', 'session_start', 'session_end']),
  event_name: z.string().optional(),
  element_id: z.string().optional(),
  url: z.string().url(),
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
  payload: z.record(z.unknown()).default({}),
  timestamp: z.string().min(1),
});

export type TrackEvent = z.infer<typeof trackEventSchema>;

// Submit de formulario → POST /api/forms/[id]
export const formSubmitSchema = trackEventSchema.extend({
  type: z.literal('form_submit'),
  payload: z.record(z.unknown()).optional(),
});

export const formSubmissionSchema = z.object({
  data: z.record(z.unknown()).default({}),
  session_id: z.string().optional(),
  fingerprint: z.string().optional(),
  referrer_url: z.string().optional(),
  utm_data: z.record(z.unknown()).optional(),
  technical: z.record(z.unknown()).optional(),
});

// Shortlink
export const shortLinkSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  target_url: z.string().url(),
  plataforma: z.string().default('General'),
});

export const shortLinkUpdateSchema = shortLinkSchema.partial();
