'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, CalendarCheck, Settings, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/booking', label: 'Đặt sân', icon: Home },
  { href: '/news', label: 'Tin tức', icon: Newspaper },
  { href: '/register-club', label: 'Hợp tác', icon: Handshake },
  { href: '/my-bookings', label: 'Lịch đặt', icon: CalendarCheck },
  { href: '/account', label: 'Tài khoản', icon: Settings },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/90 backdrop-blur-xl">
      <div className="container mx-auto grid h-16 max-w-lg grid-cols-5 px-0">
        {navItems.map((item) => {
          const isActive = pathname === '/' ? item.href === '/booking' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center gap-1 px-2 text-center text-xs font-medium',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
