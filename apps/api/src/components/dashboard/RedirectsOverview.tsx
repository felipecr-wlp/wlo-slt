import Link from 'next/link';
import { ShortLink } from '@slt/shared-types';
import { Button } from '@/components/ui/button';

export function RedirectsOverview({ links }: { links: ShortLink[] }) {
  if (!links?.length) {
    return <p className="text-sm text-gray-500 py-6">Sin redirects.</p>;
  }
  return (
    <div className="space-y-2">
      {links.map((l) => (
        <div key={l.id} className="flex items-center justify-between rounded-md border p-3">
          <div className="min-w-0">
            <Link href={`/go/${l.slug}`} className="font-medium text-blue-600 hover:underline">
              /go/{l.slug}
            </Link>
            <p className="text-sm text-gray-500 truncate max-w-xs">{l.target_url}</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium">{l.clicks} clicks</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-xs text-gray-500">{l.plataforma}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
