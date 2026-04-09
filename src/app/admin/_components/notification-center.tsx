'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSupabaseQuery } from '@/supabase';
import type { UserBooking, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCircle2, Clock, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NotificationCenter({ userProfile }: { userProfile: UserProfile }) {
    const { data: allBookings } = useSupabaseQuery<UserBooking>('bookings', undefined, { pollingInterval: 5000 });
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastSeenTime, setLastSeenTime] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            return Number(localStorage.getItem('admin_last_seen_noti') || 0);
        }
        return 0;
    });

    const relevantNotifications = useMemo(() => {
        if (!allBookings) return [];
        let filtered = allBookings;
        if (userProfile.role === 'club_owner') {
            filtered = allBookings.filter(b => userProfile.managed_club_ids?.includes(b.club_id));
        }
        return filtered
            .filter(b => b.phone !== 'Hệ thống')
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 5);
    }, [allBookings, userProfile]);

    useEffect(() => {
        if (!relevantNotifications.length) return;
        const unread = relevantNotifications.filter(n => {
            const time = new Date(n.created_at || 0).getTime();
            return time > lastSeenTime && (n.status === 'Chờ xác nhận' || (!!n.event_id && n.phone !== 'Hệ thống'));
        }).length;
        setUnreadCount(unread);
    }, [relevantNotifications, lastSeenTime]);

    const handleOpen = () => {
        const now = Date.now();
        setLastSeenTime(now);
        setUnreadCount(0);
        localStorage.setItem('admin_last_seen_noti', String(now));
    };

    const handleNotiClick = (bookingId: string) => {
        (window as any).gotoBookings?.(bookingId);
    };

    return (
        <Popover onOpenChange={(open) => open && handleOpen()}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-2">
                    <h4 className="text-sm font-semibold">Thông báo mới nhất</h4>
                    {unreadCount > 0 && <Badge variant="secondary" className="text-[10px]">{unreadCount} mới</Badge>}
                </div>
                <ScrollArea className="h-[350px]">
                    <div className="flex flex-col">
                        {relevantNotifications.length > 0 ? (
                            relevantNotifications.map((noti) => (
                                <div key={noti.id}
                                    onClick={() => handleNotiClick(noti.id)}
                                    className={cn(
                                        "flex flex-col gap-1 border-b p-4 hover:bg-muted/70 transition-colors cursor-pointer",
                                        new Date(noti.created_at || 0).getTime() > lastSeenTime && (noti.status === 'Chờ xác nhận' || (!!noti.event_id && noti.phone !== 'Hệ thống')) ? "bg-primary/10" : ""
                                    )}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold leading-none">{noti.name}</p>
                                            <p className="text-xs text-muted-foreground">{noti.club_name}</p>
                                        </div>
                                        {noti.event_id ? (
                                            <CalendarDays className="h-3 w-3 text-purple-500" />
                                        ) : noti.status === 'Chờ xác nhận' ? (
                                            <Clock className="h-3 w-3 text-yellow-500" />
                                        ) : (
                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {noti.event_id && <Badge variant="outline" className="text-[10px] h-4 px-1 border-purple-500 text-purple-600 bg-purple-50">Sự kiện</Badge>}
                                        <Badge variant="outline" className="text-[10px] h-4 px-1">{noti.slots.length} sân</Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Intl.NumberFormat('vi-VN').format(noti.total_price)}đ
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {noti.created_at ? format(new Date(noti.created_at), 'HH:mm dd/MM', { locale: vi }) : 'Vừa xong'}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Bell className="h-8 w-8 text-muted/30 mb-2" />
                                <p className="text-sm text-muted-foreground">Chưa có thông báo nào</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="border-t p-2">
                    <Button variant="ghost" className="w-full text-xs h-8 text-primary" onClick={() => (window as any).gotoBookings?.()}>
                        Xem tất cả lịch đặt
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
