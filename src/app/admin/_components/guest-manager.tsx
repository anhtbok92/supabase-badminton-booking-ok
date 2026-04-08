'use client';

import { useState, useMemo } from 'react';
import { useSupabaseQuery } from '@/supabase';
import type { UserProfile, Club, UserBooking } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, UserX, ExternalLink } from 'lucide-react';

type GuestInfo = {
    phone: string;
    name: string;
    bookingCount: number;
    lastDate: string;
    clubIds: Set<string>;
    recentBookings: UserBooking[];
};

export function GuestManager({ userProfile }: { userProfile: UserProfile }) {
    const isAdmin = userProfile.role === 'admin';
    const { data: bookings, loading: bookingsLoading } = useSupabaseQuery<UserBooking>('bookings');
    const { data: clubs, loading: clubsLoading } = useSupabaseQuery<Club>('clubs');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClubId, setSelectedClubId] = useState('all');

    const loading = bookingsLoading || clubsLoading;

    const availableClubs = useMemo(() => {
        if (!clubs) return [];
        if (isAdmin) return clubs;
        return clubs.filter(c => userProfile.managed_club_ids?.includes(c.id));
    }, [clubs, isAdmin, userProfile.managed_club_ids]);

    // Aggregate guest bookings by phone number
    const guests = useMemo(() => {
        if (!bookings) return [];
        const map = new Map<string, GuestInfo>();

        bookings.forEach(b => {
            // Guest = no user_id, has phone
            if (b.user_id || !b.phone) return;

            const key = b.phone;
            if (!map.has(key)) {
                map.set(key, {
                    phone: b.phone,
                    name: b.name || '',
                    bookingCount: 0,
                    lastDate: '',
                    clubIds: new Set(),
                    recentBookings: [],
                });
            }
            const guest = map.get(key)!;
            guest.bookingCount++;
            if (b.name && !guest.name) guest.name = b.name;
            if (!guest.lastDate || b.date > guest.lastDate) guest.lastDate = b.date;
            guest.clubIds.add(b.club_id);
            guest.recentBookings.push(b);
        });

        // Sort recent bookings and limit to 5
        map.forEach(g => {
            g.recentBookings.sort((a, b) => b.date.localeCompare(a.date));
            g.recentBookings = g.recentBookings.slice(0, 5);
        });

        return Array.from(map.values());
    }, [bookings]);

    const filteredGuests = useMemo(() => {
        let result = guests;

        // Club owner: only see guests who booked their clubs
        if (!isAdmin) {
            const ownerClubIds = userProfile.managed_club_ids || [];
            result = result.filter(g => ownerClubIds.some(id => g.clubIds.has(id)));
        }

        // Filter by club
        if (selectedClubId !== 'all') {
            result = result.filter(g => g.clubIds.has(selectedClubId));
        }

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(g =>
                g.phone.toLowerCase().includes(term) ||
                g.name.toLowerCase().includes(term)
            );
        }

        return result.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
    }, [guests, isAdmin, userProfile.managed_club_ids, selectedClubId, searchTerm]);

    const handleGoToBooking = (bookingId: string) => {
        if (typeof (window as any).gotoBookings === 'function') {
            (window as any).gotoBookings(bookingId);
        }
    };

    if (loading) return <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <UserX className="h-5 w-5" /> Khách vãng lai
                        </CardTitle>
                        <CardDescription>{filteredGuests.length} khách chưa đăng ký tài khoản</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm SĐT hoặc tên..."
                                className="pl-9 w-full sm:w-[200px]"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Lọc theo CLB" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả CLB</SelectItem>
                                {availableClubs.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên</TableHead>
                            <TableHead>SĐT</TableHead>
                            <TableHead className="text-center">Lượt đặt</TableHead>
                            <TableHead>Đặt gần nhất</TableHead>
                            <TableHead>CLB đã đặt</TableHead>
                            <TableHead>Đơn đặt gần đây</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredGuests.map(guest => {
                            const visibleClubIds = isAdmin
                                ? Array.from(guest.clubIds)
                                : Array.from(guest.clubIds).filter(id => userProfile.managed_club_ids?.includes(id));
                            const clubNames = visibleClubIds
                                .map(id => clubs?.find(c => c.id === id)?.name)
                                .filter(Boolean);

                            return (
                                <TableRow key={guest.phone}>
                                    <TableCell className="font-medium">{guest.name || '—'}</TableCell>
                                    <TableCell>{guest.phone}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{guest.bookingCount}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{guest.lastDate}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {clubNames.slice(0, 3).map((name, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
                                            ))}
                                            {clubNames.length > 3 && (
                                                <Badge variant="outline" className="text-xs">+{clubNames.length - 3}</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {guest.recentBookings.map(b => (
                                                <button
                                                    key={b.id}
                                                    onClick={() => handleGoToBooking(b.id)}
                                                    className="inline-flex items-center gap-1 text-[10px] font-mono text-primary hover:underline cursor-pointer bg-primary/5 px-1.5 py-0.5 rounded"
                                                    title={`${b.date} - ${b.status}`}
                                                >
                                                    {b.id.slice(0, 8)}
                                                    <ExternalLink className="h-2.5 w-2.5" />
                                                </button>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredGuests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    Không tìm thấy khách vãng lai nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
