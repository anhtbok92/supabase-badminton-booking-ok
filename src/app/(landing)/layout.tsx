import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sport Booking - Hệ thống đặt lịch sân thể thao',
  description: 'Đặt sân thể thao nhanh chóng, tiện lợi và hiệu quả',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
