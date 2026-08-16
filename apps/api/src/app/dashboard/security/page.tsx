import { MOCK_IP_RULES } from '@/lib/mockData';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Seguridad | wlo-slt' };

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Seguridad (WAF)</h1>

      <Card>
        <CardHeader>
          <CardTitle>Reglas de IP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2">CIDR</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Razón</th>
                  <th className="pb-2">Creado por</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_IP_RULES.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 font-mono">{r.ip_cidr}</td>
                    <td className="py-2">
                      <Badge variant={r.rule_type === 'block' ? 'destructive' : 'default'}>{r.rule_type}</Badge>
                    </td>
                    <td className="py-2 text-gray-500">{r.reason || '-'}</td>
                    <td className="py-2">{r.created_by || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate limiting & bot detection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-lg text-sm text-gray-500">
            Demo: el rate limiter y detección de bots están implementados en{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5">lib/rate-limit.ts</code> y{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5">lib/bot-detection.ts</code>.
            En producción usa Vercel KV para rate limit distribuido.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}