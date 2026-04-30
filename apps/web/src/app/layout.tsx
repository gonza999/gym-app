import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import InstallPrompt from '@/components/InstallPrompt';

export const metadata: Metadata = {
  title: 'Gym Tracker',
  description: 'Registra y consulta tus rutinas de gimnasio',
  icons: {
    icon: '/icon-192.png',
    shortcut: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="shortcut icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#2563eb" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 antialiased transition-colors">
        <AuthProvider>
          <ToastProvider>
            {children}
            <InstallPrompt />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
