'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useUser, useSupabaseQuery } from '@/supabase';
import { useTenant } from '@/hooks/use-tenant';
import type { UserBooking, Court, Event } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, Ticket, CalendarDays, MapPin } from 'lucide-react';


function GuestThankYou() {
    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b bg-card">
                <div className="container mx-auto flex h-16 items-center justify-center px-4 relative">
                    <h1 className="text-lg font-semibold font-headline">Hoàn tất</h1>
                </div>
            </header>
            <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center h-[calc(100vh-12rem)]">
                <Ticket className="h-16 w-16 text-primary mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">Cảm ơn bạn đã đặt sân!</h2>
                <p className="text-muted-foreground mb-6 max-w-xs">
                    Yêu cầu đặt sân của bạn đã được ghi nhận. Admin sẽ sớm kiểm tra và liên hệ với bạn qua điện thoại.
                </p>
                <div className="flex w-full max-w-sm flex-col gap-3">
                    <Button asChild size="lg">
                        <Link href="/booking">Tiếp tục đặt sân</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/login">Đăng ký tài khoản</Link>
                    </Button>
                </div>
            </div>
        </>
    );
}

function BookingSlotsDisplay({ booking }: { booking: UserBooking }) {
    const { data: courts, loading } = useSupabaseQuery<Court>('courts', q => q.eq('club_id', booking.club_id), { deps: [booking.club_id] });

    const formattedSlots = useMemo(() => {
        if (!booking.slots || booking.slots.length === 0) return 'Không có thông tin.';

        const slotsByCourt = booking.slots.reduce((acc, slot) => {
            const court = courts?.find(c => c.id === slot.court_id);
            const courtName = slot.court_name || court?.name || `Sân #${slot.court_id.substring(0, 5)}`;

            if (!acc[courtName]) {
                acc[courtName] = [];
            }
            acc[courtName].push(slot.time);
            return acc;
        }, {} as Record<string, string[]>);

        return Object.entries(slotsByCourt).map(([courtName, times]) => {
            const sorted = times.sort();
            const ranges: string[] = [];
            if (sorted.length > 0) {
                let start = sorted[0];
                let prev = sorted[0];
                for (let i = 1; i <= sorted.length; i++) {
                    const current = sorted[i];
                    let isConsecutive = false;
                    if (current) {
                        const [pH, pM] = prev.split(':').map(Number);
                        const [cH, cM] = current.split(':').map(Number);
                        if (cH * 60 + cM === pH * 60 + pM + 30) isConsecutive = true;
                    }
                    if (!isConsecutive) {
                        const [eH, eM] = prev.split(':').map(Number);
                        let totalMins = eH * 60 + eM + 30;
                        ranges.push(`${start} - ${Math.floor(totalMins / 60).toString().padStart(2, '0')}:${(totalMins % 60).toString().padStart(2, '0')}`);
                        if (current) { start = current; prev = current; }
                    } else { prev = current; }
                }
            }
            return (
                <div key={courtName} className="text-sm">
                    <span className="font-semibold">{courtName}:</span> {ranges.join(', ')}
                </div>
            );
        });
    }, [booking.slots, courts]);

    if (loading) {
        return <Skeleton className="h-5 w-full mt-1" />;
    }

    return <div className="space-y-1">{formattedSlots}</div>;
}

const getStatusVariant = (status: UserBooking['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'Đã xác nhận': return 'outline';
        case 'Chờ xác nhận': return 'outline';
        case 'Đã hủy': return 'outline';
        default: return 'outline';
    }
};

const getStatusClassName = (status: UserBooking['status']): string => {
    switch (status) {
        case 'Đã xác nhận': return 'bg-green-500 text-white border-green-500 hover:bg-green-500/80';
        case 'Chờ xác nhận': return 'bg-gray-400 text-white border-gray-400 hover:bg-gray-400/80';
        case 'Đã hủy': return 'bg-red-500 text-white border-red-500 hover:bg-red-500/80';
        default: return '';
    }
};

function GroupedBookingCard({ group }: { group: { id: string; clubName: string; clubId: string; dates: string[]; totalPrice: number; status: string; slotsByDate: Record<string, { time: string; courtName: string }[]>; createdAt: string | null } }) {
    const statusDisplay = group.status as UserBooking['status'];
    return (
        <Card className="overflow-hidden shadow-sm">
            <CardHeader>
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <CardTitle className="font-headline text-lg">{group.clubName}</CardTitle>
                        <CardDescription>
                            <span className="font-mono text-xs text-muted-foreground">#{group.id.slice(0, 8)}</span>
                            <span className="mx-1">·</span>
                            {group.dates.map(d => format(new Date(d + 'T00:00:00'), 'EEEE, dd/MM/yyyy', { locale: vi })).join(' • ')}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0", getStatusClassName(statusDisplay))}>{group.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ca đặt</p>
                    <div className="mt-2 space-y-2">
                        {Object.entries(group.slotsByDate).map(([date, slots]) => {
                            const byCourtMap: Record<string, string[]> = {};
                            slots.forEach((s) => {
                                if (!byCourtMap[s.courtName]) byCourtMap[s.courtName] = [];
                                byCourtMap[s.courtName].push(s.time);
                            });
                            const ranges = Object.entries(byCourtMap).map(([courtName, times]) => {
                                const sorted = times.sort();
                                const from = sorted[0];
                                const lastTime = sorted[sorted.length - 1];
                                const [h, m] = lastTime.split(':').map(Number);
                                const to = `${String(h).padStart(2, '0')}:${String(m + 30).padStart(2, '0')}`;
                                return { from, to, courtName };
                            });
                            return (
                                <div key={date} className="text-sm">
                                    <span className="font-semibold">{format(new Date(date + 'T00:00:00'), 'dd/MM/yyyy')}:</span>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {ranges.map((r, i) => (
                                            <span key={i} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                                {r.from}-{r.to} ({r.courtName})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="border-t pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng thanh toán</p>
                    <p className="text-lg font-bold text-primary mt-1">{new Intl.NumberFormat('vi-VN').format(group.totalPrice)} VND</p>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2 bg-muted/50 p-3">
                <Button variant="ghost" className="flex-1" asChild>
                    <Link href={`/dat-san/${group.clubId}`}>Đặt lại</Link>
                </Button>
                <Button className="flex-1" asChild>
                    <Link href="/booking">Xem các CLB</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function EventBookingCard({ booking, eventName }: { booking: UserBooking; eventName?: string }) {
    const formattedDate = format(new Date(booking.date + 'T00:00:00'), 'EEEE, dd/MM/yyyy', { locale: vi });
    const formattedPrice = new Intl.NumberFormat('vi-VN').format(booking.total_price);

    return (
        <Card className="overflow-hidden shadow-sm border-primary/20">
            <CardHeader>
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <CardTitle className="font-headline text-lg">{eventName || booking.club_name}</CardTitle>
                        <CardDescription>
                            <span className="font-mono text-xs text-muted-foreground">#{booking.id.slice(0, 8)}</span>
                            <span className="mx-1">·</span>
                            {booking.club_name}
                        </CardDescription>
                    </div>
                    <Badge className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/80">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        Sự kiện
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Ticket className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium">{booking.total_price > 0 ? `${formattedPrice}đ` : 'Miễn phí'}</span>
                    </div>
                    {booking.slots?.[0]?.court_name && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0 text-primary" />
                            <span>{booking.slots[0].court_name}</span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex gap-2 bg-muted/50 p-3">
                <Button variant="ghost" className="flex-1" asChild>
                    <Link href={`/su-kien/${booking.club_id}`}>Xem sự kiện</Link>
                </Button>
                <Button className="flex-1" asChild>
                    <Link href="/booking">Xem các CLB</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function LoggedInBookingsView() {
    const { user } = useUser();
    const tenant = useTenant();

    const { data: bookings, loading } = useSupabaseQuery<UserBooking>(
        'bookings',
        q => {
            let query = q.eq('user_id', user!.id);
            if (tenant) {
                query = query.eq('club_id', tenant.clubId);
            }
            return query;
        },
        { deps: [user?.id, tenant?.clubId] }
    );

    // Collect event_ids from event bookings to fetch event names
    const eventIds = useMemo(() => {
        if (!bookings) return [];
        return [...new Set(bookings.filter(b => b.event_id && b.status === 'Sự kiện').map(b => b.event_id!))];
    }, [bookings]);

    const { data: events } = useSupabaseQuery<Event>(
        eventIds.length > 0 ? 'events' : null,
        q => q.in('id', eventIds),
        { deps: [eventIds.join(',')] }
    );

    const eventNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        events?.forEach(e => { map[e.id] = e.event_name; });
        return map;
    }, [events]);

    // Separate event bookings from regular bookings
    const { eventBookings, regularBookings } = useMemo(() => {
        if (!bookings) return { eventBookings: [] as UserBooking[], regularBookings: [] as UserBooking[] };
        const ev: UserBooking[] = [];
        const reg: UserBooking[] = [];
        bookings.forEach(b => {
            if (b.is_deleted) return;
            if (b.status === 'Sự kiện') ev.push(b);
            else reg.push(b);
        });
        ev.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        return { eventBookings: ev, regularBookings: reg };
    }, [bookings]);

    const groupedBookings = useMemo(() => {
        const groups: Record<string, any> = {};
        regularBookings.forEach(booking => {
            const createdAtStr = booking.created_at ? Math.floor(new Date(booking.created_at).getTime() / 1000).toString() : 'no-time';
            const key = booking.booking_group_id || `${booking.phone}-${booking.status}-${createdAtStr}`;
            if (!groups[key]) {
                groups[key] = { id: key, clubName: booking.club_name, clubId: booking.club_id, dates: [], totalPrice: 0, status: booking.status, slotsByDate: {} as Record<string, { time: string; courtName: string }[]>, createdAt: booking.created_at || null };
            }
            const g = groups[key];
            g.totalPrice += booking.total_price;
            if (!g.dates.includes(booking.date)) g.dates.push(booking.date);
            if (!g.slotsByDate[booking.date]) g.slotsByDate[booking.date] = [];
            booking.slots.forEach(s => {
                if (!g.slotsByDate[booking.date].some((existing: any) => existing.time === s.time && existing.courtName === (s.court_name || ''))) {
                    g.slotsByDate[booking.date].push({ time: s.time, courtName: s.court_name || '' });
                }
            });
            if (booking.created_at && (!g.createdAt || new Date(booking.created_at).getTime() > new Date(g.createdAt).getTime())) {
                g.createdAt = booking.created_at;
            }
        });
        return Object.values(groups)
            .map((g: any) => ({
                ...g,
                dates: g.dates.sort((a: string, b: string) => a.localeCompare(b)),
                slotsByDate: Object.fromEntries(Object.entries(g.slotsByDate).map(([date, slots]: [string, any]) => [date, slots.sort((a: any, b: any) => a.time.localeCompare(b.time))]))
            }))
            .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [regularBookings]);


    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md border-b">
                <h1 className="text-lg font-bold">Lịch đặt của tôi</h1>
            </header>

            <main className="flex-grow p-4 space-y-4 pb-24">
                {loading && Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardHeader><div className="flex justify-between items-start"><div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-40" /></div><Skeleton className="h-6 w-24 rounded-full" /></div></CardHeader>
                        <CardContent className="space-y-4"><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-full" /></div><div className="border-t pt-4 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-7 w-28" /></div></CardContent>
                        <CardFooter className="flex gap-2 bg-muted/50 p-3"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /></CardFooter>
                    </Card>
                ))}
                {groupedBookings.map((group: any) => (
                    <GroupedBookingCard key={group.id} group={group} />
                ))}
                {eventBookings.map((booking) => (
                    <EventBookingCard key={booking.id} booking={booking} eventName={booking.event_id ? eventNameMap[booking.event_id] : undefined} />
                ))}
                {!loading && groupedBookings.length === 0 && eventBookings.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center pt-20">
                        <CalendarCheck className="h-16 w-16 text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold">Bạn chưa có lịch đặt nào</h2>
                        <p className="mt-2 text-muted-foreground max-w-xs">Tất cả các lượt đặt sân của bạn sẽ được hiển thị ở đây.</p>
                        <Button asChild className="mt-6">
                            <Link href="/booking">Đặt sân ngay</Link>
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}

function PageSkeleton() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md border-b">
                <Skeleton className="h-7 w-40" />
            </header>
            <main className="p-4 space-y-4 pb-24">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardHeader><div className="flex justify-between items-start"><div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-40" /></div><Skeleton className="h-6 w-24 rounded-full" /></div></CardHeader>
                        <CardContent className="space-y-4"><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-full" /></div><div className="border-t pt-4 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-7 w-28" /></div></CardContent>
                        <CardFooter className="flex gap-2 bg-muted/50 p-3"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /></CardFooter>
                    </Card>
                ))}
            </main>
        </div>
    );
}

export default function MyBookingsPage() {
    const { user, loading } = useUser();

    if (loading) {
        return <PageSkeleton />;
    }

    if (user) {
        return <LoggedInBookingsView />;
    }

    return <GuestThankYou />;
}
