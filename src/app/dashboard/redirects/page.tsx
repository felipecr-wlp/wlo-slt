'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, ExternalLink } from 'lucide-react';
import type { ShortLink } from '@slt/shared-types';

export default function RedirectsPage() {
  const router = useRouter();
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/redirects');
    const d = await r.json();
    if (r.ok) setLinks(d);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!slug.trim() || !url.trim()) return;
    setCreating(true);
    setErr('');
    const r = await fetch('/api/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name, target_url: url }),
    });
    const d = await r.json();
    if (r.ok) {
      setLinks([d, ...links]);
      setSlug('');
      setName('');
      setUrl('');
    } else {
      setErr(d.error || 'error');
    }
    setCreating(false);
  };

  const remove = async (s: string) => {
    if (!confirm('Eliminar redirect?')) return;
    await fetch(`/api/redirects/${s}`, { method: 'DELETE' });
    setLinks(links.filter((l) => l.slug !== s));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Redirects</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo redirect</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Slug (ej: demo)" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="URL destino" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button onClick={create} disabled={creating || !slug.trim() || !url.trim()}>
            {creating ? 'Creando...' : 'Crear'}
          </Button>
        </CardContent>
        {err && <p className="px-6 pb-2 text-sm text-red-600">{err}</p>}
      </Card>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {links.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-md border p-4">
              <div>
                <a
                  href={`/go/${l.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  /go/{l.slug}
                </a>
                <p className="text-sm text-gray-500 truncate max-w-sm">{l.target_url}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{l.clicks} clicks</Badge>
                <Badge>{l.plataforma}</Badge>
                <a href={`/go/${l.slug}`} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-700">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Button variant="ghost" onClick={() => remove(l.slug)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
          {links.length === 0 && <p className="text-sm text-gray-500">Sin redirects.</p>}
        </div>
      )}
    </div>
  );
}