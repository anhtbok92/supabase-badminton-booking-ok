import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseProvider } from '@/supabase';
import { ThemeProvider } from '@/components/theme-provider';
import { getSeoMetadata } from '@/lib/seo';
import { SeoHead } from '@/components/seo-head';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSeoMetadata('app-home', {
      title: 'Sport Booking - Hệ thống Đặt sân Cầu lông',
      description: 'Đặt sân cầu lông yêu thích của bạn trực tuyến. Nhanh chóng, chính xác và chuyên nghiệp.',
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
      title: 'Sport Booking - Hệ thống Đặt sân Cầu lông',
      description: 'Đặt sân cầu lông yêu thích của bạn trực tuyến. Nhanh chóng, chính xác và chuyên nghiệp.',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <SeoHead pageSlug="app-home" />
      </head>
      <body className={cn('font-body antialiased')}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SupabaseProvider>
            {children}
            <Toaster />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
