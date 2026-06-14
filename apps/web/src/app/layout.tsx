import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ServiceWorkerRegister } from '@/components/providers/sw-register';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'SI Learning Red',
  description: 'Software de simulación interactiva para la enseñanza de redes',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <ToastProvider>
            <ServiceWorkerRegister />
            <main id="main-content" className="flex-1">
              {children}
            </main>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
