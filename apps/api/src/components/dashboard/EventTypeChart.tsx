'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MOCK_EVENTS_BY_TYPE } from '@/lib/mockData';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function EventTypeChart() {
  const data = MOCK_EVENTS_BY_TYPE.map((e) => ({ name: e.type, value: e.total }));
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
