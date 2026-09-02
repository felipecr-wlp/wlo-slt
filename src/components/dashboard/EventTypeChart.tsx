'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface TypeCount { name: string; value: number }

export function EventTypeChart() {
  const [data, setData] = useState<TypeCount[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/events')
      .then((r) => r.json())
      .then((events: any[]) => {
        const map = new Map<string, number>();
        events.forEach((e) => {
          const t = e.event_type || 'unknown';
          map.set(t, (map.get(t) || 0) + 1);
        });
        setData(Array.from(map.entries()).map(([name, value]) => ({ name, value })));
      })
      .catch(() => {});
  }, []);

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 py-6 text-center">Sin datos de eventos aún.</p>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
