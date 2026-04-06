'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Feather, Menu, User as UserIcon, LogOut } from 'lucide-react';

import { useSupabase, useUser, useSupabaseRow } from '@/supabase';
import { useTenant } from '@/hooks/use-tenant';
import type { Club } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from './ui/skeleton';

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/my-bookings', label: 'Lịch đặt của tôi' },
];

function UserNav() {
    const supabase = useSupabase();
    const { user, loading } = useUser();

    if (loading) {
        return <Skeleton className="h-8 w-8 rounded-full" />;
    }

    if (!user) {
        return (
            <Link href="/login">
                <Button variant="outline" size="sm">Đăng nhập</Button>
            </Link>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://picsum.photos/seed/${user.id}/32/32`} alt="User Avatar" data-ai-hint="animal avatar" />
                        <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Tài khoản</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                     <Link href="/my-bookings">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Lịch đặt của tôi</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tenant = useTenant();
  const { data: club } = useSupabaseRow<Club>(tenant ? 'clubs' : null, tenant?.clubId ?? null);

  const clubLogo = club?.image_urls?.[0] ?? null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          {tenant && clubLogo ? (
            <Image
              src={clubLogo}
              alt={tenant.clubName}
              width={28}
              height={28}
              className="h-7 w-7 rounded-md object-cover"
            />
          ) : (
            <Feather className="h-7 w-7 text-primary" />
          )}
          <span className="text-xl font-bold font-headline tracking-tight">
            {tenant ? tenant.clubName : 'Hub Cầu Lông'}
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/admin" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-4">
            <div className='hidden md:block'>
                <UserNav />
            </div>
            {/* Mobile Nav */}
            <div className="md:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Mở menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right">
                    <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription className="sr-only">
                        Điều hướng trang web
                    </SheetDescription>
                    </SheetHeader>
                    <nav className="mt-8 flex flex-col gap-6">
                    {navLinks.map((link) => (
                        <SheetClose asChild key={link.href}>
                             <Link
                                href={link.href}
                                className="text-lg font-medium"
                            >
                                {link.label}
                            </Link>
                        </SheetClose>
                    ))}
                    <SheetClose asChild>
                        <Link href="/admin" className="text-lg font-medium pt-4 mt-4 border-t">
                            Admin
                        </Link>
                    </SheetClose>
                     <div className="pt-4 mt-4 border-t">
                        <UserNav />
                    </div>
                    </nav>
                </SheetContent>
                </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
