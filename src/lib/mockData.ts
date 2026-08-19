// Mock data para el demo. Se usa cuando Supabase no está configurado
// (env faltantes), garantizando que el dashboard siempre renderiza.

import type { EventRow, FormSubmission, ShortLink, Form } from '@slt/shared-types';

export const MOCK_STATS = {
  events: 1248,
  sessions: 312,
  forms: 3,
  submissions: 42,
  redirects: 2,
  bounceRate: 54,
  avgSessionSec: 186,
};

export const MOCK_EVENTS: EventRow[] = [
  { id: '1', session_id: 'sess_1', event_type: 'pageview', url: 'https://ejemplo.com/', referrer: 'https://google.com', country: 'ES', city: 'Madrid', device_type: 'desktop', created_at: '2026-08-14T10:23:11Z' },
  { id: '2', session_id: 'sess_1', event_type: 'click', element_id: 'cta-hero', url: 'https://ejemplo.com/', country: 'ES', device_type: 'desktop', created_at: '2026-08-14T10:23:18Z' },
  { id: '3', session_id: 'sess_2', event_type: 'form_submit', element_id: 'demo-contact', url: 'https://ejemplo.com/contacto', country: 'ES', city: 'Barcelona', device_type: 'mobile', created_at: '2026-08-14T10:22:01Z' },
  { id: '4', session_id: 'sess_3', event_type: 'scroll', element_id: 'scroll_75', url: 'https://ejemplo.com/blog', device_type: 'mobile', created_at: '2026-08-14T10:21:44Z' },
  { id: '5', session_id: 'sess_3', event_type: 'pageview', url: 'https://ejemplo.com/blog', referrer: 'https://wlo-slt.vercel.app', device_type: 'mobile', created_at: '2026-08-14T10:21:30Z' },
  { id: '6', session_id: 'sess_1', event_type: 'pageview', url: 'https://ejemplo.com/gracias', referrer: 'https://ejemplo.com/', country: 'ES', device_type: 'desktop', created_at: '2026-08-14T10:23:40Z' },
  { id: '7', session_id: 'sess_4', event_type: 'click', element_id: 'whatsapp-float', url: 'https://ejemplo.com/', country: 'ES', device_type: 'mobile', created_at: '2026-08-14T10:20:12Z' },
  { id: '8', session_id: 'sess_5', event_type: 'form_submit', element_id: 'demo-contact', url: 'https://ejemplo.com/contacto', country: 'ES', city: 'Valencia', device_type: 'desktop', created_at: '2026-08-14T10:18:55Z' },
];

export const MOCK_FORMS: Form[] = [
  {
    id: 'demo-contact',
    title: 'Contacto Demo',
    fields: [
      { type: 'text', label: 'Nombre', name: 'nombre', required: true },
      { type: 'email', label: 'Email', name: 'email', required: true },
      { type: 'tel', label: 'Teléfono', name: 'telefono' },
      { type: 'textarea', label: 'Mensaje', name: 'mensaje' },
    ],
    routing: {
      email_notify: true,
      email_to: 'ventas@ejemplo.com',
      email_subject: 'Nuevo lead: {slt_nombre}',
      email_body: '<h3>Nuevo lead</h3>',
    },
    action_type: 'message',
    redirect_url: '',
    txt_submit: 'Enviar',
    txt_success: '¡Gracias!',
    txt_error: 'Error al enviar',
    txt_next: 'Siguiente',
    txt_prev: 'Atrás',
    colors: {},
    rules: [],
    status: 'active',
    group_name: 'General',
    created_at: '2026-08-01T12:00:00Z',
    updated_at: '2026-08-01T12:00:00Z',
  },
];

export const MOCK_SUBMISSIONS: FormSubmission[] = [
  { id: 's1', form_id: 'demo-contact', form: { title: 'Contacto Demo' }, session_id: 'sess_3', data: { nombre: 'Ana Gómez', email: 'ana@ejemplo.com', telefono: '600123456', mensaje: 'Quiero más info' }, lead_name: 'Ana Gómez', lead_email: 'ana@ejemplo.com', lead_phone: '600123456', status: 'synced', created_at: '2026-08-14T10:22:01Z' },
  { id: 's2', form_id: 'demo-contact', form: { title: 'Contacto Demo' }, session_id: 'sess_5', data: { nombre: 'Luis Rojas', email: 'luis@ejemplo.com', telefono: '600789012', mensaje: 'Cotización' }, lead_name: 'Luis Rojas', lead_email: 'luis@ejemplo.com', lead_phone: '600789012', status: 'synced', created_at: '2026-08-14T10:18:55Z' },
  { id: 's3', form_id: 'demo-contact', form: { title: 'Contacto Demo' }, session_id: 'sess_7', data: { nombre: 'Marta Ruiz', email: 'marta@ejemplo.com', mensaje: 'Solo info' }, lead_name: 'Marta Ruiz', lead_email: 'marta@ejemplo.com', lead_phone: undefined, status: 'new', created_at: '2026-08-14T10:10:22Z' },
];

export const MOCK_SHORTLINKS: ShortLink[] = [
  { id: 'lnk_demo', name: 'Demo Landing', slug: 'demo', target_url: 'https://ejemplo.com/landing?utm_source=slt', plataforma: 'General', clicks: 128, created_at: '2026-08-01T12:00:00Z', updated_at: '2026-08-01T12:00:00Z' },
  { id: 'lnk_pricing', name: 'Pricing', slug: 'pricing', target_url: 'https://ejemplo.com/pricing', plataforma: 'Google', clicks: 84, created_at: '2026-08-02T09:00:00Z', updated_at: '2026-08-02T09:00:00Z' },
];

export const MOCK_FUNNELS = [
  { fecha: '08/08', visitas: 120, form_visto: 110, enviado: 32 },
  { fecha: '09/08', visitas: 145, form_visto: 130, enviado: 38 },
  { fecha: '10/08', visitas: 162, form_visto: 140, enviado: 44 },
  { fecha: '11/08', visitas: 138, form_visto: 122, enviado: 36 },
  { fecha: '12/08', visitas: 175, form_visto: 158, enviado: 51 },
];

export const MOCK_EVENTS_BY_TYPE = [
  { type: 'pageview', total: 712 },
  { type: 'form_submit', total: 42 },
  { type: 'click', total: 298 },
  { type: 'scroll', total: 196 },
];

export const MOCK_IP_RULES = [
  { id: '1', ip_cidr: '127.0.0.1/32', rule_type: 'block', reason: 'Pruebas manuales', created_by: 'admin', created_at: '2026-08-01T00:00:00Z' },
  { id: '2', ip_cidr: '0.0.0.0/0', rule_type: 'allow', reason: 'Allow-all demo', created_by: 'system', created_at: '2026-08-01T00:00:00Z' },
];

export const MOCK_INTEGRATIONS = [
  { id: '1', integration: 'pipedrive', is_active: true, config: { api_key: '***' }, updated_at: '2026-08-05T10:00:00Z' },
  { id: '2', integration: 'resend', is_active: true, config: { from: 'noreply@wlo-slt.vercel.app' }, updated_at: '2026-08-05T10:00:00Z' },
];

export const MOCK_REALTIME_EVENTS: EventRow[] = [];
export function mockRealtimePush(event: EventRow) {
  MOCK_REALTIME_EVENTS.unshift(event);
  if (MOCK_REALTIME_EVENTS.length > 30) MOCK_REALTIME_EVENTS.pop();
}
