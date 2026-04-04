'use client';

import Link from 'next/link';
import { useSupabase, useUser, useSupabaseRow } from '@/supabase';
import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LogOut,
  User as UserIcon,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  CalendarDays,
  Ticket,
  HelpCircle,
  Info,
  Settings,
} from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

// New component for list items
const AccountListItem = ({
  icon,
  label,
  href,
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  disabled?: boolean;
}) => {
  const Icon = icon;
  const content = (
    <div className={cn(
        "flex items-center gap-4 px-4 min-h-[56px] justify-between transition-colors",
        disabled ? "opacity-50 cursor-not-allowed bg-muted/5" : "active:bg-secondary/50 cursor-pointer"
    )}>
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn(
            "flex items-center justify-center rounded-lg shrink-0 size-10",
            disabled ? "bg-muted text-muted-foreground" : "text-primary bg-primary/10"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col min-w-0">
            <p className={cn(
                "text-base font-normal leading-tight truncate",
                disabled ? "text-muted-foreground" : "text-card-foreground"
            )}>
              {label}
            </p>
            {disabled && <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mt-0.5" data-ai-hint="coming soon">Sắp ra mắt</p>}
        </div>
      </div>
      {!disabled && (
        <div className="shrink-0">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
};

// New Skeleton for the page
function AccountPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex items-center p-4 justify-center relative">
        <h2 className="text-lg font-bold">Tài khoản</h2>
      </header>
      <section className="flex p-6 flex-col items-center gap-4">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-32" />
        </div>
      </section>
      <div className="px-4 space-y-6">
        <div>
          <Skeleton className="h-5 w-48 mb-2" />
          <div className="rounded-xl overflow-hidden border">
            <Skeleton className="h-[56px] w-full" />
            <Skeleton className="h-[56px] w-full" />
          </div>
        </div>
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <div className="rounded-xl overflow-hidden border">
            <Skeleton className="h-[56px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Logged In View
function LoggedInView({ user, userProfile }: { user: any; userProfile: UserProfile | null }) {
  const supabase = useSupabase();

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col">
      <header className="flex items-center p-4 justify-center relative sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <h2 className="text-lg font-bold">Tài khoản</h2>
      </header>

      <section className="flex p-6 flex-col gap-4 items-center">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-primary/20">
            <AvatarImage src={`https://picsum.photos/seed/${user.id}/128/128`} alt="User Avatar" data-ai-hint="animal avatar" />
            <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-foreground text-2xl font-bold text-center">{userProfile?.phone || user.email?.split('@')[0]}</p>
          <p className="text-muted-foreground text-base font-medium text-center">{user.email}</p>
        </div>
      </section>

      <div className="px-4 space-y-2">
        <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider px-2 pt-4 pb-1">Cài đặt tài khoản</h3>
        <div className="bg-card rounded-xl overflow-hidden border">
          <AccountListItem icon={UserIcon} label="Thông tin cá nhân (Sắp ra mắt)" disabled />
          <div className="border-t"><AccountListItem icon={ShieldCheck} label="Đổi mật khẩu (Sắp ra mắt)" disabled /></div>
          <div className="border-t"><AccountListItem icon={CreditCard} label="Phương thức thanh toán (Sắp ra mắt)" disabled /></div>
        </div>

        <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider px-2 pt-6 pb-1">Hoạt động</h3>
        <div className="bg-card rounded-xl overflow-hidden border">
          <AccountListItem icon={CalendarDays} label="Lịch sử đặt sân" href="/my-bookings" />
          <div className="border-t"><AccountListItem icon={Ticket} label="Ưu đãi của tôi (Sắp ra mắt)" disabled /></div>
        </div>

        <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider px-2 pt-6 pb-1">Hỗ trợ</h3>
        <div className="bg-card rounded-xl overflow-hidden border">
          <AccountListItem icon={HelpCircle} label="Trung tâm trợ giúp (Sắp ra mắt)" disabled />
          <div className="border-t"><AccountListItem icon={Info} label="Về chúng tôi (Sắp ra mắt)" disabled /></div>
        </div>

        <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-wider px-2 pt-6 pb-1">Hợp tác</h3>
        <div className="bg-card rounded-xl overflow-hidden border">
          <AccountListItem icon={Ticket} label="Đăng ký chủ sân" href="/register-club" />
        </div>

        <div className="pt-10 pb-4">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive font-bold py-3 rounded-xl border border-destructive/20 active:scale-[0.98] transition-all">
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
        </div>

        <p className="text-center text-muted-foreground text-xs font-normal pb-8">Phiên bản 1.0.0</p>
      </div>
    </div>
  );
}

// Logged Out View
function LoggedOutView() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center h-[calc(100vh-8rem)]">
      <Settings className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold font-headline mb-2">Tài khoản</h2>
      <p className="text-muted-foreground mb-6 max-w-xs">Đăng nhập hoặc tạo tài khoản để xem lịch sử đặt sân và nhận nhiều ưu đãi.</p>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button asChild size="lg">
          <Link href="/login">Đăng nhập</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Đăng ký</Link>
        </Button>
      </div>
    </div>
  );
}

// Main Page Component
export default function AccountPage() {
  const { user, loading: authLoading } = useUser();
  const { data: userProfile, loading: profileLoading } = useSupabaseRow<UserProfile>(user ? 'users' : null, user?.id ?? null);

  const loading = authLoading || (user && profileLoading);

  if (loading) {
    return <AccountPageSkeleton />;
  }

  if (user) {
    return <LoggedInView user={user} userProfile={userProfile} />;
  }

  return <LoggedOutView />;
}