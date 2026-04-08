'use client';

import { useState, useMemo } from 'react';
import { DatePicker, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { AntdRegistry } from '@ant-design/nextjs-registry';

dayjs.locale('vi');

import { useSupabaseQuery } from '@/supabase';
import type { UserBooking, Club, UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart as BarChartIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export function StatisticsManager({ userProfile }: { userProfile: UserProfile }) {
    const [filter, setFilter] = useState<string>('this_month');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(() => [dayjs().startOf('month'), dayjs().endOf('month')]);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all');

    const { data: allBookings, loading: bookingsLoading } = useSupabaseQuery<UserBooking>('bookings', (q) => q.eq('status', 'Đã xác nhận'));
    const { data: allUsers, loading: usersLoading } = useSupabaseQuery<UserProfile>('users', (q) => q.eq('role', 'customer'));
    const { data: clubs, loading: clubsLoading } = useSupabaseQuery<Club>('clubs');
    const { data: owners, loading: ownersLoading } = useSupabaseQuery<UserProfile>(userProfile.role === 'admin' ? 'users' : null, (q) => q.eq('role', 'club_owner'));

    const loading = bookingsLoading || usersLoading || (userProfile.role === 'admin' && (clubsLoading || ownersLoading));

    const handleFilterChange = (value: string) => {
        setFilter(value);
        let from, to;
        switch (value) {
            case 'today': from = dayjs().startOf('day'); to = dayjs().endOf('day'); break;
            case 'last_7_days': from = dayjs().subtract(6, 'day').startOf('day'); to = dayjs().endOf('day'); break;
            case 'this_month': from = dayjs().startOf('month'); to = dayjs().endOf('month'); break;
            case 'this_year': from = dayjs().startOf('year'); to = dayjs().endOf('year'); break;
            default: from = null; to = null;
        }
        setDateRange([from, to]);
    };

    const stats = useMemo(() => {
        let bookingsToProcess = allBookings;
        if (userProfile.role === 'admin') {
            if (selectedOwnerId !== 'all') {
                const selectedOwner = owners?.find(o => o.id === selectedOwnerId);
                const ownerClubIds = selectedOwner?.managed_club_ids || [];
                bookingsToProcess = allBookings?.filter(b => ownerClubIds.includes(b.club_id)) ?? null;
            }
        } else { bookingsToProcess = allBookings?.filter(b => userProfile.managed_club_ids?.includes(b.club_id)) ?? null; }
        if (!bookingsToProcess || !dateRange || !dateRange[0] || !dateRange[1]) return { totalRevenue: 0, totalBookings: 0, chartData: [], ownerRevenue: [], topCustomers: [], topGuests: [] };
        const filteredBookings = bookingsToProcess.filter(b => {
            const bookingDate = dayjs(b.date + 'T00:00:00');
            return (bookingDate.isAfter(dateRange[0], 'day') || bookingDate.isSame(dateRange[0], 'day')) && (bookingDate.isBefore(dateRange[1], 'day') || bookingDate.isSame(dateRange[1], 'day'));
        });
        const totalRevenue = filteredBookings.reduce((acc, b) => acc + b.total_price, 0);
        const totalBookings = filteredBookings.length;
        const diffDays = dateRange[1]!.diff(dateRange[0]!, 'day');
        const chartData = Array.from({ length: diffDays + 1 }).map((_, i) => {
            const day = dateRange[0]!.add(i, 'day'); const dayStr = day.format('YYYY-MM-DD');
            const revenue = filteredBookings.filter(b => b.date === dayStr).reduce((acc, b) => acc + b.total_price, 0);
            return { date: day.format('DD/MM'), Doanhthu: revenue };
        });
        let ownerRevenue: { ownerEmail: string; revenue: number }[] = [];
        if (userProfile.role === 'admin' && owners && clubs) {
            const clubToOwnerMap = new Map<string, string>();
            owners.forEach(owner => { owner.managed_club_ids?.forEach(clubId => { clubToOwnerMap.set(clubId, owner.email || owner.id); }); });
            const revenueByOwner = new Map<string, number>();
            filteredBookings.forEach(booking => { const ownerEmail = clubToOwnerMap.get(booking.club_id); if (ownerEmail) revenueByOwner.set(ownerEmail, (revenueByOwner.get(ownerEmail) || 0) + booking.total_price); });
            ownerRevenue = Array.from(revenueByOwner.entries()).map(([ownerEmail, revenue]) => ({ ownerEmail, revenue })).sort((a, b) => b.revenue - a.revenue);
        }

        // Top registered customers
        const customerCounts = new Map<string, { count: number; revenue: number; phone: string; name: string }>();
        filteredBookings.forEach(b => {
            if (b.user_id) {
                const prev = customerCounts.get(b.user_id) || { count: 0, revenue: 0, phone: b.phone || '', name: b.name || '' };
                customerCounts.set(b.user_id, {
                    count: prev.count + 1,
                    revenue: prev.revenue + b.total_price,
                    phone: prev.phone || b.phone || '',
                    name: prev.name || b.name || '',
                });
            }
        });
        const topCustomers = Array.from(customerCounts.entries())
            .map(([userId, data]) => {
                const user = allUsers?.find(u => u.id === userId);
                const displayName = user?.phone || data.phone || user?.email?.split('@')[0] || data.name || 'Không rõ';
                return { name: displayName, count: data.count, revenue: data.revenue };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Top guest customers (no user_id)
        const guestCounts = new Map<string, { name: string; count: number; revenue: number }>();
        filteredBookings.forEach(b => {
            if (!b.user_id && b.phone) {
                const prev = guestCounts.get(b.phone) || { name: b.name || '', count: 0, revenue: 0 };
                guestCounts.set(b.phone, { name: prev.name || b.name || '', count: prev.count + 1, revenue: prev.revenue + b.total_price });
            }
        });
        const topGuests = Array.from(guestCounts.entries())
            .map(([phone, data]) => ({ phone, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return { totalRevenue, totalBookings, chartData, ownerRevenue, topCustomers, topGuests };
    }, [allBookings, userProfile, dateRange, owners, clubs, selectedOwnerId, allUsers]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    if (loading) return <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>;

    return (
        <Card>
            <CardHeader><CardTitle>Thống kê</CardTitle><CardDescription>Xem doanh thu và lượt đặt sân theo khoảng thời gian.</CardDescription>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-4">
                    <Select value={filter} onValueChange={handleFilterChange}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">Hôm nay</SelectItem><SelectItem value="last_7_days">7 ngày qua</SelectItem><SelectItem value="this_month">Tháng này</SelectItem><SelectItem value="this_year">Năm nay</SelectItem></SelectContent></Select>
                    <AntdRegistry><ConfigProvider locale={viVN}><DatePicker.RangePicker value={dateRange} onChange={(dates) => { setDateRange(dates as any); setFilter('custom'); }} format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} className="w-full sm:w-auto h-10" allowClear={true} variant="outlined" /></ConfigProvider></AntdRegistry>
                    {userProfile.role === 'admin' && (<Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}><SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Lọc theo chủ club" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả chủ club</SelectItem>{owners?.map(o => <SelectItem key={o.id} value={o.id}>{o.email}</SelectItem>)}</SelectContent></Select>)}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle><span className="text-muted-foreground">VND</span></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tổng lượt đặt sân</CardTitle><BarChartIcon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalBookings}</div></CardContent></Card>
                </div>
                <Card><CardHeader><CardTitle>Biểu đồ Doanh thu</CardTitle></CardHeader><CardContent>
                    <ChartContainer config={{ Doanhthu: { label: "Doanh thu", color: "hsl(var(--primary))" } }} className="h-72 w-full">
                        <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}><CartesianGrid vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} /><YAxis width={100} tickFormatter={(value) => formatCurrency(value as number)} /><ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} /><Bar dataKey="Doanhthu" fill="var(--color-Doanhthu)" radius={4} /></BarChart>
                    </ChartContainer>
                </CardContent></Card>
                {userProfile.role === 'admin' && stats.ownerRevenue.length > 0 && (<Card><CardHeader><CardTitle>Doanh thu theo Chủ Club</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Chủ Club</TableHead><TableHead className="text-right">Doanh thu</TableHead></TableRow></TableHeader><TableBody>{stats.ownerRevenue.map(item => (<TableRow key={item.ownerEmail}><TableCell>{item.ownerEmail}</TableCell><TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>)}
                <div className="grid gap-4 md:grid-cols-2">
                    {stats.topCustomers.length > 0 && (
                        <Card><CardHeader><CardTitle className="text-base">Top khách hàng đặt nhiều nhất</CardTitle><CardDescription>Khách đã đăng ký tài khoản</CardDescription></CardHeader><CardContent>
                            <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Khách hàng</TableHead><TableHead className="text-center">Lượt đặt</TableHead><TableHead className="text-right">Doanh thu</TableHead></TableRow></TableHeader>
                                <TableBody>{stats.topCustomers.map((c, i) => (
                                    <TableRow key={i}><TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell><TableCell className="font-medium">{c.name}</TableCell><TableCell className="text-center">{c.count}</TableCell><TableCell className="text-right">{formatCurrency(c.revenue)}</TableCell></TableRow>
                                ))}</TableBody>
                            </Table>
                        </CardContent></Card>
                    )}
                    {stats.topGuests.length > 0 && (
                        <Card><CardHeader><CardTitle className="text-base">Top khách vãng lai đặt nhiều nhất</CardTitle><CardDescription>Khách chưa đăng ký tài khoản</CardDescription></CardHeader><CardContent>
                            <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Tên</TableHead><TableHead>SĐT</TableHead><TableHead className="text-center">Lượt đặt</TableHead><TableHead className="text-right">Doanh thu</TableHead></TableRow></TableHeader>
                                <TableBody>{stats.topGuests.map((g, i) => (
                                    <TableRow key={i}><TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell><TableCell className="font-medium">{g.name || '—'}</TableCell><TableCell>{g.phone}</TableCell><TableCell className="text-center">{g.count}</TableCell><TableCell className="text-right">{formatCurrency(g.revenue)}</TableCell></TableRow>
                                ))}</TableBody>
                            </Table>
                        </CardContent></Card>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
