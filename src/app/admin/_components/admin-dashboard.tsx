'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/supabase';
import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LayoutDashboard, CalendarDays, Building, Newspaper, Tags, Users, Shapes, LogOut, Feather, CalendarClock, CreditCard, FileText, Search, PenTool, Gift, Globe } from 'lucide-react';
import {
    SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset,
    SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import { NotificationCenter } from './notification-center';
import { ScheduleManager } from './schedule-manager';
import { BookingManager } from './booking-manager';
import { ClubManager } from './club-manager';
import { StaffManager } from './staff-manager';
import { ClubTypeManager } from './club-type-manager';
import { NewsManager } from './news-manager';
import { TagManager } from './tag-manager';
import { ClubOwnerManager } from './club-owner-manager';
import { StatisticsManager } from './statistics-manager';
import { SubscriptionPlanManager } from './subscription-plan-manager';
import { ClubSubscriptionManager } from './club-subscription-manager';
import { SubscriptionDashboard } from './subscription-dashboard';
import { FixedBookingManager } from './fixed-booking-manager';
import { UserGuideGenerator } from './user-guide-generator';
import { SeoManager } from './seo-manager';
import { SeoPagesGenerator } from './seo-pages-generator';
import { BlogAiWriter } from './blog-ai-writer';
import { PromoSettingsManager } from './promo-settings-manager';
import { CustomerManager } from './customer-manager';
import { GuestManager } from './guest-manager';
import { EventManager } from './event-manager';
import { useTenant } from '@/hooks/use-tenant';

export function AdminDashboard({ userProfile }: { userProfile: UserProfile }) {
    const supabase = useSupabase();
    const tenant = useTenant();
    const isAdmin = userProfile.role === 'admin';
    const isClubOwner = userProfile.role === 'club_owner';
    const isStaff = userProfile.role === 'staff';
    const isTenantScoped = !!tenant && !isAdmin;
    const [managedClubName, setManagedClubName] = useState<string>('');
    const [isClubNameLoading, setIsClubNameLoading] = useState(false);

    useEffect(() => {
        if (tenant && !isAdmin) {
            setManagedClubName(tenant.clubName);
            return;
        }
        if ((isClubOwner || isStaff) && userProfile.managed_club_ids && userProfile.managed_club_ids.length > 0) {
            setIsClubNameLoading(true);
            const fetchClubName = async () => {
                const { data, error } = await supabase
                    .from('clubs')
                    .select('name')
                    .eq('id', userProfile.managed_club_ids![0])
                    .single();
                if (!error && data) {
                    setManagedClubName(data.name);
                }
                setIsClubNameLoading(false);
            };
            fetchClubName();
        }
    }, [isClubOwner, isStaff, isAdmin, tenant, userProfile.managed_club_ids, supabase]);


    const [activeView, setActiveView] = useState(() => isStaff ? 'schedule' : 'stats');
    const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

    const navItems = [
        { id: 'stats', label: 'Thống kê', icon: LayoutDashboard, roles: ['admin', 'club_owner'] },
        { id: 'schedule', label: 'Lịch sân', icon: CalendarClock, roles: ['admin', 'club_owner', 'staff'] },
        { id: 'fixedBookings', label: 'Lịch cố định', icon: CalendarDays, roles: ['admin', 'club_owner', 'staff'] },
        { id: 'bookings', label: 'Quản lý Lịch đặt', icon: CalendarDays, roles: ['admin', 'club_owner', 'staff'] },
        { id: 'events', label: 'Sự kiện', icon: CalendarDays, roles: ['admin', 'club_owner'] },
        ...(!isTenantScoped ? [{ id: 'clubs', label: 'Quản lý Câu lạc bộ', icon: Building, roles: ['admin', 'club_owner'] }] : []),
        { id: 'staff', label: 'Quản lý Nhân viên', icon: Users, roles: ['admin', 'club_owner'] },
        { id: 'customers', label: 'Quản lý Khách hàng', icon: Users, roles: ['admin', 'club_owner'] },
        { id: 'guests', label: 'Khách vãng lai', icon: Users, roles: ['admin', 'club_owner'] },
        { id: 'subscriptionDashboard', label: 'Thống kê Gói đăng ký', icon: CreditCard, roles: ['admin'] },
        { id: 'subscriptions', label: 'Quản lý Gói đăng ký', icon: CreditCard, roles: ['admin'] },
        { id: 'clubSubscriptions', label: 'Gói đăng ký CLB', icon: CreditCard, roles: ['admin'] },
        { id: 'clubTypes', label: 'Loại CLB', icon: Shapes, roles: ['admin'] },
        { id: 'news', label: 'Quản lý Tin tức', icon: Newspaper, roles: ['admin'] },
        { id: 'tags', label: 'Quản lý Tags', icon: Tags, roles: ['admin'] },
        { id: 'owners', label: 'Quản lý Chủ Club', icon: Users, roles: ['admin'] },
        { id: 'userGuide', label: 'Tài liệu Hướng dẫn', icon: FileText, roles: ['admin'] },
        { id: 'seo', label: 'Quản lý SEO', icon: Search, roles: ['admin'] },
        { id: 'seoPages', label: 'SEO Landing Pages', icon: Globe, roles: ['admin'] },
        { id: 'blogAi', label: 'Blog AI Writer', icon: PenTool, roles: ['admin'] },
        { id: 'promo', label: 'Cấu hình Popup', icon: Gift, roles: ['admin'] },
    ];

    const currentViewLabel = navItems.find(item => item.id === activeView)?.label || 'Dashboard';

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    useEffect(() => {
        (window as any).gotoBookings = (bookingId?: string) => {
            setActiveView('bookings');
            if (bookingId) {
                setHighlightedBookingId(bookingId);
            }
        };
        return () => { delete (window as any).gotoBookings; };
    }, []);

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <Link href="/" className="flex items-center gap-3 px-3 py-6 border-b border-sidebar-border/50">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary-foreground overflow-hidden shadow-lg border border-primary/10">
                            <Image src="/favicon.png" alt="Logo" width={44} height={44} className="object-cover scale-90" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase font-black tracking-[0.1em] text-primary leading-none mb-1">{isTenantScoped ? tenant!.clubName : 'Sport Booking'}</span>
                            {!isAdmin ? (
                                isClubNameLoading ? (
                                    <Skeleton className="h-4 w-24 mt-0.5" />
                                ) : (
                                    <h1 className="text-sm font-bold text-slate-800 leading-tight line-clamp-2">
                                        {managedClubName || 'Câu lạc bộ'}
                                    </h1>
                                )
                            ) : (
                                <h1 className="text-sm font-bold text-slate-800 leading-tight">Administrator</h1>
                            )}
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                                <span className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    isAdmin ? "bg-red-500" : isClubOwner ? "bg-emerald-500" : "bg-blue-500"
                                )} />
                                {isAdmin ? 'Quản trị hệ thống' : isClubOwner ? 'Chủ sở hữu' : 'Nhân viên'}
                            </p>
                        </div>
                    </Link>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        {navItems.map((item) => (
                            (item.roles.includes(userProfile.role as any)) && (
                                <SidebarMenuItem key={item.id}>
                                    <SidebarMenuButton
                                        onClick={() => setActiveView(item.id)}
                                        isActive={activeView === item.id}
                                        tooltip={item.label}
                                    >
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        ))}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleLogout}>
                                <LogOut />
                                <span>Đăng xuất</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset className="flex flex-col h-screen overflow-hidden">
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="md:hidden" />
                        <Link href="/" className="flex items-center gap-2 md:hidden overflow-hidden">
                            <Image src="/favicon.png" alt="Logo" width={28} height={28} className="rounded-lg shadow-sm" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] uppercase font-black tracking-wider text-primary leading-none">Sport Booking</span>
                                <span className="font-bold text-xs line-clamp-2">
                                    {isAdmin ? "Admin" : (managedClubName || "Loading...")}
                                </span>
                            </div>
                        </Link>
                        <h2 className="hidden md:block text-lg font-bold">{currentViewLabel}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationCenter userProfile={userProfile} />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={`https://picsum.photos/seed/${userProfile.id}/36/36`} alt="User Avatar" data-ai-hint="person avatar" />
                                        <AvatarFallback>{userProfile.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{userProfile.email}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{userProfile.role}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Đăng xuất</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 min-h-0 overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8">
                    <div className="flex-1 min-h-0 flex flex-col">
                        {activeView === 'schedule' ? (
                            <ScheduleManager userProfile={userProfile} />
                        ) : (
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                {activeView === 'stats' && <StatisticsManager userProfile={userProfile} />}
                                {activeView === 'bookings' && (
                                    <BookingManager
                                        userProfile={userProfile}
                                        highlightedBookingId={highlightedBookingId}
                                        onHighlightCleared={() => setHighlightedBookingId(null)}
                                    />
                                )}
                                {activeView === 'fixedBookings' && <FixedBookingManager userProfile={userProfile} />}
                                {activeView === 'clubs' && <ClubManager userProfile={userProfile} />}
                                {activeView === 'staff' && (isAdmin || isClubOwner) && <StaffManager userProfile={userProfile} />}
                                {(isAdmin || isClubOwner) && activeView === 'customers' && <CustomerManager userProfile={userProfile} />}
                                {(isAdmin || isClubOwner) && activeView === 'guests' && <GuestManager userProfile={userProfile} />}
                                {(isAdmin || isClubOwner) && activeView === 'events' && <EventManager userProfile={userProfile} />}
                                {isAdmin && activeView === 'subscriptionDashboard' && <SubscriptionDashboard />}
                                {isAdmin && activeView === 'subscriptions' && <SubscriptionPlanManager />}
                                {isAdmin && activeView === 'clubSubscriptions' && <ClubSubscriptionManager />}
                                {isAdmin && activeView === 'clubTypes' && <ClubTypeManager />}
                                {isAdmin && activeView === 'news' && <NewsManager />}
                                {isAdmin && activeView === 'tags' && <TagManager />}
                                {isAdmin && activeView === 'owners' && <ClubOwnerManager />}
                                {isAdmin && activeView === 'userGuide' && <UserGuideGenerator />}
                                {isAdmin && activeView === 'seo' && <SeoManager />}
                                {isAdmin && activeView === 'seoPages' && <SeoPagesGenerator />}
                                {isAdmin && activeView === 'blogAi' && <BlogAiWriter />}
                                {isAdmin && activeView === 'promo' && <PromoSettingsManager />}
                            </div>
                        )}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
