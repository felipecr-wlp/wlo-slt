import Link from 'next/link';
import { ReactNode } from 'react';

const nav = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Eventos', href: '/dashboard/events' },
  { label: 'Formularios', href: '/dashboard/forms' },
  { label: 'Redirects', href: '/dashboard/redirects' },
  { label: 'Integraciones', href: '/dashboard/integrations' },
  { label: 'Seguridad', href: '/dashboard/security' },
  { label: 'Ajustes', href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r bg-white dark:bg-gray-900 dark:border-gray-800 md:flex">
        <div className="p-5 text-lg font-semibold">🚀 wlo-slt</div>
        <nav className="flex flex-col gap-1 p-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
