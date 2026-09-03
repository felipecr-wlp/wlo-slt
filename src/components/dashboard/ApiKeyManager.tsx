'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  endpoint: string;
  is_active: boolean;
  permissions: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  key?: string;
}

const ENDPOINTS = [
  { value: 'slt', label: 'SLT PRO ( eventos, redirects, webhooks )' },
  { value: 'wordpress', label: 'WordPress ( webhook genérico )' },
  { value: 'tracker', label: 'Tracker JS ( eventos frontend )' },
];

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [error, setError] = useState('');

  // Form
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('slt');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    const r = await fetch('/api/api-keys');
    const d = await r.json();
    if (r.ok) {
      setKeys(d);
    } else {
      setError(d.error || 'Error al cargar keys');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    const r = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, endpoint }),
    });
    const d = await r.json();
    if (r.ok) {
      setNewKey(d);
      setKeys([{ ...d, key: undefined }, ...keys]);
      setName('');
      setShowCreate(false);
    } else {
      setError(d.error || 'Error al crear key');
    }
    setCreating(false);
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch(`/api/api-keys/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: active }),
    });
    setKeys(keys.map((k) => k.id === id ? { ...k, is_active: active } : k));
  };

  const remove = async (id: string) => {
    if (!confirm('Eliminar esta API key? No se puede deshacer.')) return;
    await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
    setKeys(keys.filter((k) => k.id !== id));
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert('Copiada al portapapeles');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>API Keys</CardTitle>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancelar' : '+ Nueva API Key'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
            {error.includes('does not exist') && (
              <p className="mt-1 text-xs text-red-600">
                Ejecuta la migración 005_api_keys.sql en Supabase SQL Editor.
              </p>
            )}
          </div>
        )}

        {showCreate && (
          <div className="rounded-md border p-4 space-y-3">
            <div><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: SLT PRO - welovepaving" /></div>
            <div>
              <Label>Endpoint</Label>
              <select value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="mt-1 block w-full rounded-md border border-input bg-white px-3 py-2 text-gray-900 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
                {ENDPOINTS.map((ep) => <option key={ep.value} value={ep.value}>{ep.label}</option>)}
              </select>
            </div>
            <Button onClick={create} disabled={creating || !name.trim()}>
              {creating ? 'Creando...' : 'Crear API Key'}
            </Button>
          </div>
        )}

        {newKey && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 space-y-2">
            <p className="text-sm font-medium text-green-800">API Key creada. Guárdala ahora — no se mostrará de nuevo.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-green-100 px-2 py-1 text-sm break-all">{newKey.key}</code>
              <Button variant="outline" onClick={() => copyKey(newKey.key!)}>Copiar</Button>
            </div>
            <p className="text-xs text-green-700">Prefijo: {newKey.key_prefix}... | Endpoint: {newKey.endpoint}</p>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-gray-500">No hay API keys creadas.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{k.name}</span>
                    <Badge variant={k.is_active ? 'default' : 'secondary'}>
                      {k.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <Badge variant="outline">{k.endpoint}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {k.key_prefix}... | Creada: {new Date(k.created_at).toLocaleDateString()}
                    {k.last_used_at && ` | Último uso: ${new Date(k.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => toggle(k.id, !k.is_active)}>
                    {k.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button variant="ghost" onClick={() => remove(k.id)}>
                    <span className="text-red-600">Eliminar</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
