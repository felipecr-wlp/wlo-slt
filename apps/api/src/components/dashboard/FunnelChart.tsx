'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_FUNNELS } from '@/lib/mockData';

export function FunnelChart() {
  const data = MOCK_FUNNELS.map((f) => ({
    label: f.fecha,
    Visitas: f.visitas,
    'Form visto': f.form_visto,
    Enviado: f.enviado,
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="Visitas" fill="#93c5fd" />
          <Bar dataKey="Form visto" fill="#60a5fa" />
          <Bar dataKey="Enviado" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
