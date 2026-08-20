'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Form } from '@slt/shared-types';

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/forms');
    if (r.ok) {
      const data = await r.json();
      setForms(data);
    } else {
      setErr('Error al cargar formularios');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm('Eliminar este formulario?')) return;
    const r = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
    if (r.ok) setForms(forms.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Formularios</h1>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {forms.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-md border p-4">
              <div>
                <Link href={`/dashboard/forms/${f.id}`} className="font-medium text-blue-600 hover:underline">
                  {f.title}
                </Link>
                <p className="text-sm text-gray-500">{f.page_url || 'Sin URL'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={f.status === 'active' ? 'default' : 'secondary'}>{f.status}</Badge>
                <Badge variant="secondary">{(f.fields || []).length} campos</Badge>
                <Link href={`/dashboard/forms/${f.id}`}>
                  <Button variant="outline">Editar</Button>
                </Link>
                <Button variant="ghost" onClick={() => remove(f.id)}>
                  <span className="text-red-600">Eliminar</span>
                </Button>
              </div>
            </div>
          ))}
          {forms.length === 0 && <p className="text-sm text-gray-500">No hay formularios creados.</p>}
        </div>
      )}
    </div>
  );
}
