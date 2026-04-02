import type { Metadata } from 'next';
import { getSeoMetadata } from '@/lib/seo';
import { SeoHead } from '@/components/seo-head';

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata('landing', {
    title: 'Sport Booking - Hệ thống đặt sân thể thao thông minh',
    description: 'Giải pháp quản lý và đặt sân toàn diện cho câu lạc bộ thể thao.',
  });
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SeoHead pageSlug="landing" />
      {children}
    </>
  );
}
