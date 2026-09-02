'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  endpoint: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export default function SecurityPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('slt');
  const [newExpiry, setNewExpiry] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadKeys = async () => {
    setLoading(true);
    const r = await fetch('/api/security/api-keys');
    if (r.ok) setKeys(await r.json());
    setLoading(false);
  };

  useEffect(() => { loadKeys(); }, []);

  const createKey = async () => {
    if (!newName.trim()) return;
    setError('');
    const r = await fetch('/api/security/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName,
        endpoint: newEndpoint,
        expires_in_days: newExpiry ? Number(newExpiry) : undefined,
      }),
    });
    const data = await r.json();
    if (data.key) {
      setCreatedKey(data.key);
      setNewName('');
      setNewExpiry('');
      setShowCreate(false);
      loadKeys();
    } else {
      setError(data.error || 'Error creando key');
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('¿Eliminar esta API key?')) return;
    await fetch(`/api/security/api-keys?id=${id}`, { method: 'DELETE' });
    loadKeys();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Seguridad</h1>

      {createdKey && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-green-800">API Key creada. Cópiala ahora — no se volverá a mostrar:</p>
            <code className="mt-2 block rounded bg-white p-3 text-sm font-mono break-all border">{createdKey}</code>
            <Button onClick={() => navigator.clipboard.writeText(createdKey)}>Copiar</Button>
            <Button className="ml-2" variant="outline" onClick={() => setCreatedKey(null)}>Cerrar</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>API Keys</CardTitle>
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancelar' : '+ Nueva Key'}
          </Button>
        </CardHeader>
        <CardContent>
          {showCreate && (
            <div className="mb-4 space-y-3 rounded border p-4">
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Nombre (ej: WordPress SLT)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                value={newEndpoint}
                onChange={(e) => setNewEndpoint(e.target.value)}
              >
                <option value="slt">SLT Webhook (evento/redirect)</option>
                <option value="webhook">Webhook General</option>
                <option value="ingest">Tracker Ingest</option>
              </select>
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Expira en días (opcional)"
                type="number"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button onClick={createKey}>Crear Key</Button>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-gray-500">No hay API keys creadas. Crea una para conectar WordPress.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2">Nombre</th>
                    <th className="pb-2">Prefijo</th>
                    <th className="pb-2">Endpoint</th>
                    <th className="pb-2">Estado</th>
                    <th className="pb-2">Último uso</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className="border-t">
                      <td className="py-2 font-medium">{k.name}</td>
                      <td className="py-2 font-mono text-xs">{k.key_prefix}...</td>
                      <td className="py-2"><Badge variant="outline">{k.endpoint}</Badge></td>
                      <td className="py-2">
                        <Badge variant={k.is_active ? 'default' : 'destructive'}>
                          {k.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-500 text-xs">
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleString('es-MX') : 'Nunca'}
                      </td>
                      <td className="py-2">
                        <Button variant="destructive" onClick={() => deleteKey(k.id)}>Eliminar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cómo usar desde WordPress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Endpoint:</p>
            <code className="rounded bg-gray-100 px-1.5">POST https://wlo-slt.vercel.app/api/webhooks/slt</code>
          </div>
          <div>
            <p className="font-medium">Header requerido:</p>
            <code className="rounded bg-gray-100 px-1.5">x-slt-key: &lt;tu_api_key&gt;</code>
          </div>
          <div>
            <p className="font-medium">Tipos de payload:</p>
            <ul className="list-disc pl-5 text-gray-600">
              <li><code>tipo: &quot;evento&quot;</code> — tracking de eventos (pageview, click, form_submit)</li>
              <li><code>tipo: &quot;redirect&quot;</code> — clicks en enlaces cortos</li>
              <li><code>tipo: &quot;webhook&quot;</code> — webhooks de CRM (Pipedrive, etc.)</li>
              <li><code>tipo: &quot;test_connection&quot;</code> — prueba de conexión</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
