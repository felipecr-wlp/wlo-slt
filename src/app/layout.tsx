import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Simple Lead Tracker — wlo-slt',
  description: 'External WLO simple lead tracker tool (demo).',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
