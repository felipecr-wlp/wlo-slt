import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface Stat {
  label: string;
  value: number;
  icon: ReactNode;
  change?: string;
  color?: string;
}

export function StatsCards({ stats }: { stats: Record<string, number> }) {
  const items: Stat[] = [
    { label: 'Eventos', value: stats.events ?? 0, icon: '📈', change: '+12%', color: 'text-blue-600' },
    { label: 'Sesiones', value: stats.sessions ?? 0, icon: '👥', change: '+8%', color: 'text-purple-600' },
    { label: 'Formularios', value: stats.forms ?? 0, icon: '📝', color: 'text-amber-600' },
    { label: 'Leads', value: stats.submissions ?? 0, icon: '🎯', change: '+5%', color: 'text-green-600' },
    { label: 'Redirects', value: stats.redirects ?? 0, icon: '🔗', color: 'text-indigo-600' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {items.map((s) => (
        <Card key={s.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
            <span className="text-xl">{s.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.value.toLocaleString()}</div>
            {s.change && <p className="text-xs text-gray-500">{s.change} este mes</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}