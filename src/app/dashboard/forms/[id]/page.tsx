import { getFormById } from '@/lib/data';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Formulario | wlo-slt' };

export default async function FormPage({ params }: { params: { id: string } }) {
  const form = await getFormById(params.id);
  if (!form) {
    return (
      <div className="py-10 text-center">
        <Badge variant="destructive">404</Badge>
        <h2 className="mt-4 text-xl font-semibold">Formulario no encontrado</h2>
        <p className="mt-2 text-gray-500">ID: {params.id}</p>
        <Link href="/dashboard/forms" className="mt-4 inline-block text-blue-600">
          ← Volver a formularios
        </Link>
      </div>
    );
  }
  return <FormBuilder form={form} />;
}