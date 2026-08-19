import Link from 'next/link';
import { formatDate, statusColor } from '@/lib/utils';
import type { FormSubmission } from '@slt/shared-types';
import { Badge } from '@/components/ui/badge';

export function FormsOverview({ submissions }: { submissions: FormSubmission[] }) {
  if (!submissions?.length) {
    return <p className="text-sm text-gray-500 py-6">Sin submissions todavía.</p>;
  }
  return (
    <div className="space-y-2">
      {submissions.map((s) => (
        <Link
          key={s.id}
          href={`/dashboard/forms/${s.form_id}`}
          className="block rounded-md border p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{s.lead_name || s.lead_email || 'Lead sin nombre'}</p>
              <p className="text-sm text-gray-500">{s.lead_email}</p>
            </div>
            <div className="text-right">
              <Badge className={statusColor(s.status || 'new')}>{s.status}</Badge>
              <p className="text-xs text-gray-500">{formatDate(s.created_at)}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
