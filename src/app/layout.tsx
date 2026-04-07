import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseProvider } from '@/supabase';
import { ThemeProvider } from '@/components/theme-provider';
import { getSeoMetadata } from '@/lib/seo';
import { SeoHead } from '@/components/seo-head';
import { TenantProvider } from '@/components/tenant-provider';
import { getTenantContext } from '@/lib/tenant';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoMetadata('landing', {
      title: 'Sport Booking - Hệ thống đặt sân thể thao thông minh',
      description: 'Giải pháp quản lý và đặt sân toàn diện cho câu lạc bộ thể thao.',
    });
    return {
      ...seo,
      icons: {
        icon: [
          { url: '/favicon.png', type: 'image/png' },
          { url: '/icon.png', type: 'image/png' },
        ],
        shortcut: '/favicon.png',
        apple: '/apple-icon.png',
      },
    };
  } catch {
    return {
      title: 'Sport Booking - Hệ thống đặt sân thể thao thông minh',
      description: 'Giải pháp quản lý và đặt sân toàn diện cho câu lạc bộ thể thao.',
      icons: {
        icon: [
          { url: '/favicon.png', type: 'image/png' },
          { url: '/icon.png', type: 'image/png' },
        ],
        shortcut: '/favicon.png',
        apple: '/apple-icon.png',
      },
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenantContext();

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <SeoHead pageSlug="landing" />
      </head>
      <body className={cn('font-body antialiased')}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SupabaseProvider>
            <TenantProvider tenant={tenant}>
              {children}
            </TenantProvider>
            <Toaster />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
