import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Ajustes | wlo-slt' };

export default function SettingsPage() {
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasWpKey = Boolean(process.env.WORDPRESS_WEBHOOK_KEY);
  const endpoint = process.env.NEXT_PUBLIC_TRACKER_ENDPOINT || 'https://wlo-slt.vercel.app/api/ingest';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      <Card>
        <CardHeader>
          <CardTitle>Estado de servicios</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <StatusRow label="Supabase URL" ok={hasSupabase} />
          <StatusRow label="Resend (email)" ok={hasResend} />
          <StatusRow label="Endpoint tracker" ok={true} value={endpoint} />
          <StatusRow label="WordPress webhook" ok={hasWpKey} value={hasWpKey ? 'Autenticado' : 'Sin WORDPRESS_WEBHOOK_KEY'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Snippet de instalación (tracker.js)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 max-w-lg text-sm text-gray-500">
            Copie este snippet en cualquier sitio (WP, React, Vue, HTML estático) para
            empezar a trackear leads:
          </p>
          <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
{`<script src="https://wlo-slt.vercel.app/tracker.js"
  data-site-id="misitio"
  data-endpoint="${endpoint}"
  data-auto-init="true"></script>`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integración WordPress (Simple Lead Tracker PRO)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="max-w-lg text-sm text-gray-500">
            Endpoint para recibir leads desde el plugin Simple Lead Tracker PRO de WordPress.
            Acepta el formato nativo del plugin (url_pagina, user_name, user_email, etc.).
          </p>
          <div className="rounded-md bg-gray-900 p-4 text-sm text-gray-100">
            <p className="mb-1"><strong>Endpoint:</strong> <code>POST https://wlo-slt.vercel.app/api/webhooks/wordpress</code></p>
            <p className="mb-1"><strong>Auth:</strong> Header <code>X-WP-KEY: tu-api-key</code></p>
            <p className="mb-1"><strong>Env var:</strong> <code>WORDPRESS_WEBHOOK_KEY</code></p>
          </div>
          <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">
{`// Formato Simple Lead Tracker PRO (WP plugin)
{
  "event": "form_submit",
  "url_pagina": "https://welovepaving.invify.online/contacto",
  "user_name": "Juan Pérez",
  "user_email": "juan@ejemplo.com",
  "user_phone": "+52 55 1234 5678",
  "session_id": "CDMX | CDMX | IP:189.203.100.50",
  "fingerprint": "abc123",
  "elemento_id": "form_contacto",
  "observaciones": "Lead desde formulario"
}`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variables de entorno</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-lg text-sm text-gray-500">
            Configure estas variables en Vercel (Project Settings → Environment Variables):
            <code className="mt-2 block rounded bg-gray-100 px-1.5 py-1 dark:bg-gray-800">
              NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, RESEND_API_KEY, WORDPRESS_WEBHOOK_KEY
            </code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusRow({ label, ok, value }: { label: string; ok: boolean; value?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <span className="text-sm text-gray-500">{value || ''}</span>
      <Badge variant={ok ? 'default' : 'secondary'}>{ok ? 'Conectado' : 'Sin configurar'}</Badge>
    </div>
  );
}