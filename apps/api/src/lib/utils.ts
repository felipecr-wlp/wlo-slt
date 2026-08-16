import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}

export function statusColor(status: string) {
  switch (status) {
    case 'synced':
      return 'bg-green-100 text-green-700';
    case 'error':
      return 'bg-red-100 text-red-700';
    case 'active':
      return 'bg-blue-100 text-blue-700';
    case 'archived':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-amber-100 text-amber-700';
  }
}
