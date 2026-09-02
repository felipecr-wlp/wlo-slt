'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface FunnelData {
  label: string;
  Visitas: number;
  'Form visto': number;
  Enviado: number;
}

export function FunnelChart() {
  const [data, setData] = useState<FunnelData[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/funnels')
      .then((r) => r.json())
      .then((d) => {
        if (d.funnels?.length) {
          setData(d.funnels.map((f: any) => ({
            label: f.fecha || f.date || '-',
            Visitas: f.visitas || f.visits || 0,
            'Form visto': f.form_visto || f.form_viewed || 0,
            Enviado: f.enviado || f.submitted || 0,
          })));
        }
      })
      .catch(() => {});
  }, []);

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 py-6 text-center">Sin datos de funnel aún.</p>;
  }

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
