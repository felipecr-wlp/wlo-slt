import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Simple Lead Tracker — wlo-slt',
  description: 'External WLO simple lead tracker tool (demo).',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var d = document.documentElement;
            var theme = localStorage.getItem('theme');
            if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              d.classList.add('dark');
            } else {
              d.classList.remove('dark');
            }
          })();
        `}} />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
