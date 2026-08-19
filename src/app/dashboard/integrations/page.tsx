import { MOCK_INTEGRATIONS } from '@/lib/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Integraciones | wlo-slt' };

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Integraciones</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {MOCK_INTEGRATIONS.map((i) => (
          <Card key={i.integration}>
            <CardHeader>
              <CardTitle className="capitalize">{i.integration}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant={i.is_active ? 'default' : 'secondary'}>
                  {i.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
                <span className="text-xs text-gray-500">
                  Actualizada: {new Date(i.updated_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar integración</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-lg text-sm text-gray-500">
            Demo: configura credenciales vía variables de entorno (.env.local) o usa los
            webhooks en <code className="rounded bg-gray-100 px-1.5 py-0.5">/api/webhooks/*</code>.
            Las configs activas se guardan en <code className="rounded bg-gray-100 px-1.5 py-0.5">integration_configs</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}