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
import { Search, Users, ExternalLink } from 'lucide-react';

export function CustomerManager({ userProfile }: { userProfile: UserProfile }) {
    const isAdmin = userProfile.role === 'admin';
    const { data: customers, loading: customersLoading } = useSupabaseQuery<UserProfile>('users', q => q.eq('role', 'customer'));
    const { data: bookings, loading: bookingsLoading } = useSupabaseQuery<UserBooking>('bookings');
    const { data: clubs, loading: clubsLoading } = useSupabaseQuery<Club>('clubs');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClubId, setSelectedClubId] = useState('all');

    const loading = customersLoading || bookingsLoading || clubsLoading;

    // For club_owner: only show clubs they manage
    const availableClubs = useMemo(() => {
        if (!clubs) return [];
        if (isAdmin) return clubs;
        return clubs.filter(c => userProfile.managed_club_ids?.includes(c.id));
    }, [clubs, isAdmin, userProfile.managed_club_ids]);

    // Map: userId → set of clubIds they booked
    const userClubMap = useMemo(() => {
        const map = new Map<string, Set<string>>();
        bookings?.forEach(b => {
            if (b.user_id) {
                if (!map.has(b.user_id)) map.set(b.user_id, new Set());
                map.get(b.user_id)!.add(b.club_id);
            }
        });
        return map;
    }, [bookings]);

    // Map: userId → total bookings count
    const userBookingCount = useMemo(() => {
        const map = new Map<string, number>();
        bookings?.forEach(b => {
            if (b.user_id) {
                map.set(b.user_id, (map.get(b.user_id) || 0) + 1);
            }
        });
        return map;
    }, [bookings]);

    // Map: userId → last booking date
    const userLastBooking = useMemo(() => {
        const map = new Map<string, string>();
        bookings?.forEach(b => {
            if (b.user_id) {
                const current = map.get(b.user_id);
                if (!current || b.date > current) map.set(b.user_id, b.date);
            }
        });
        return map;
    }, [bookings]);

    // Map: userId → list of bookings (sorted by date desc, max 5)
    const userBookings = useMemo(() => {
        const map = new Map<string, UserBooking[]>();
        bookings?.forEach(b => {
            if (b.user_id) {
                if (!map.has(b.user_id)) map.set(b.user_id, []);
                map.get(b.user_id)!.push(b);
            }
        });
        map.forEach((list, key) => {
            map.set(key, list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5));
        });
        return map;
    }, [bookings]);

    const handleGoToBooking = (bookingId: string) => {
        if (typeof (window as any).gotoBookings === 'function') {
            (window as any).gotoBookings(bookingId);
        }
    };

    const filteredCustomers = useMemo(() => {
        if (!customers) return [];
        let result = customers;

        // Club owner: only see users who booked their clubs
        if (!isAdmin) {
            const ownerClubIds = userProfile.managed_club_ids || [];
            result = result.filter(c => {
                const userClubs = userClubMap.get(c.id);
                return userClubs && ownerClubIds.some(id => userClubs.has(id));
            });
        }

        // Filter by club
        if (selectedClubId !== 'all') {
            result = result.filter(c => {
                const userClubs = userClubMap.get(c.id);
                return userClubs?.has(selectedClubId);
            });
        }

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.email?.toLowerCase().includes(term) ||
                c.phone?.toLowerCase().includes(term)
            );
        }

        return result;
    }, [customers, isAdmin, userProfile.managed_club_ids, selectedClubId, searchTerm, userClubMap]);

    if (loading) return <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Quản lý Khách hàng
                        </CardTitle>
                        <CardDescription>{filteredCustomers.length} khách hàng</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm SĐT hoặc email..."
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
                            <TableHead>SĐT</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-center">Lượt đặt</TableHead>
                            <TableHead>Đặt gần nhất</TableHead>
                            <TableHead>CLB đã đặt</TableHead>
                            <TableHead>Đơn đặt gần đây</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.map(customer => {
                            const bookingCount = userBookingCount.get(customer.id) || 0;
                            const lastDate = userLastBooking.get(customer.id);
                            const customerClubs = userClubMap.get(customer.id);
                            const visibleClubIds = customerClubs
                                ? (isAdmin ? Array.from(customerClubs) : Array.from(customerClubs).filter(id => userProfile.managed_club_ids?.includes(id)))
                                : [];
                            const clubNames = visibleClubIds.map(id => clubs?.find(c => c.id === id)?.name).filter(Boolean);

                            return (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.phone || '—'}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{customer.email || '—'}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{bookingCount}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{lastDate || '—'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {clubNames.slice(0, 3).map((name, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
                                            ))}
                                            {clubNames.length > 3 && (
                                                <Badge variant="outline" className="text-xs">+{clubNames.length - 3}</Badge>
                                            )}
                                            {clubNames.length === 0 && <span className="text-muted-foreground text-xs">—</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {(userBookings.get(customer.id) || []).map(b => (
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
                                            {(userBookings.get(customer.id) || []).length === 0 && <span className="text-muted-foreground text-xs">—</span>}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredCustomers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    Không tìm thấy khách hàng nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
