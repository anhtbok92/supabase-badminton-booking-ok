'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/supabase';
import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LayoutDashboard, CalendarDays, Building, Newspaper, Tags, Users, Shapes, LogOut, Feather, CalendarClock, CreditCard } from 'lucide-react';
import {
    SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset,
    SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

export function AdminDashboard({ userProfile }: { userProfile: UserProfile }) {
    const supabase = useSupabase();
    const isAdmin = userProfile.role === 'admin';
    const isClubOwner = userProfile.role === 'club_owner';
    const isStaff = userProfile.role === 'staff';

    const [activeView, setActiveView] = useState(() => isStaff ? 'schedule' : 'stats');
    const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

    const navItems = [
        { id: 'stats', label: 'Thống kê', icon: LayoutDashboard, roles: ['admin', 'club_owner'] },
        { id: 'schedule', label: 'Lịch sân', icon: CalendarClock, roles: ['admin', 'club_owner', 'staff'] },
        { id: 'bookings', label: 'Quản lý Lịch đặt', icon: CalendarDays, roles: ['admin', 'club_owner', 'staff'] },
        { id: 'clubs', label: 'Quản lý Câu lạc bộ', icon: Building, roles: ['admin', 'club_owner'] },
        { id: 'staff', label: 'Quản lý Nhân viên', icon: Users, roles: ['admin', 'club_owner'] },
        { id: 'subscriptionDashboard', label: 'Thống kê Gói đăng ký', icon: CreditCard, roles: ['admin'] },
        { id: 'subscriptions', label: 'Quản lý Gói đăng ký', icon: CreditCard, roles: ['admin'] },
        { id: 'clubSubscriptions', label: 'Gói đăng ký CLB', icon: CreditCard, roles: ['admin'] },
        { id: 'clubTypes', label: 'Loại CLB', icon: Shapes, roles: ['admin'] },
        { id: 'news', label: 'Quản lý Tin tức', icon: Newspaper, roles: ['admin'] },
        { id: 'tags', label: 'Quản lý Tags', icon: Tags, roles: ['admin'] },
        { id: 'owners', label: 'Quản lý Chủ Club', icon: Users, roles: ['admin'] },
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
                    <Link href="/" className="flex items-center gap-2 px-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Feather className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-base font-bold">Admin Hub</h1>
                            <p className="text-xs text-sidebar-foreground/70">{isAdmin ? 'Quản trị viên' : isClubOwner ? 'Chủ Câu lạc bộ' : 'Nhân viên'}</p>
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
                        <Link href="/" className="flex items-center gap-2 md:hidden">
                            <Feather className="h-6 w-6 text-primary" />
                            <span className="font-bold">Admin Hub</span>
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
                                {activeView === 'clubs' && <ClubManager userProfile={userProfile} />}
                                {activeView === 'staff' && (isAdmin || isClubOwner) && <StaffManager userProfile={userProfile} />}
                                {isAdmin && activeView === 'subscriptionDashboard' && <SubscriptionDashboard />}
                                {isAdmin && activeView === 'subscriptions' && <SubscriptionPlanManager />}
                                {isAdmin && activeView === 'clubSubscriptions' && <ClubSubscriptionManager />}
                                {isAdmin && activeView === 'clubTypes' && <ClubTypeManager />}
                                {isAdmin && activeView === 'news' && <NewsManager />}
                                {isAdmin && activeView === 'tags' && <TagManager />}
                                {isAdmin && activeView === 'owners' && <ClubOwnerManager />}
                            </div>
                        )}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
