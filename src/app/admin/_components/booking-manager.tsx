'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DatePicker, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { AntdRegistry } from '@ant-design/nextjs-registry';

dayjs.locale('vi');

import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { UserBooking, Club, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, CheckCircle2, FileDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function ImageViewer({ imageUrls, startIndex, isOpen, onClose }: { imageUrls: string[]; startIndex: number; isOpen: boolean; onClose: () => void; }) {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [zoom, setZoom] = useState(1);
    useEffect(() => { if (isOpen) { setCurrentIndex(startIndex); setZoom(1); } }, [isOpen, startIndex]);
    if (!isOpen || !imageUrls || imageUrls.length === 0) return null;
    const currentImage = imageUrls[currentIndex];
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-7xl w-full h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b"><DialogTitle>Xem bằng chứng thanh toán</DialogTitle><DialogDescription>Ảnh {currentIndex + 1} trên {imageUrls.length}.</DialogDescription></DialogHeader>
                <div className="flex-grow min-h-0 relative flex items-center justify-center overflow-auto bg-muted/50">
                    <Image key={currentImage} src={currentImage} alt={`Bằng chứng thanh toán ${currentIndex + 1}`} width={1920} height={1080} className="block object-contain h-auto w-auto max-h-full max-w-full transition-transform duration-200" style={{ transform: `scale(${zoom})` }} />
                </div>
                {imageUrls.length > 1 && (<>
                    <Button variant="ghost" size="icon" onClick={() => { setCurrentIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length); setZoom(1); }} className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white z-10"><ChevronLeft className="h-8 w-8" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setCurrentIndex((prev) => (prev + 1) % imageUrls.length); setZoom(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/30 hover:bg-black/50 text-white z-10"><ChevronRight className="h-8 w-8" /></Button>
                </>)}
                <div className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background">
                    <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))} disabled={zoom <= 0.5}><ZoomOut className="h-4 w-4 mr-2" /> Thu nhỏ</Button>
                    <Button variant="outline" size="sm" onClick={() => setZoom(1)} disabled={zoom === 1}>Reset</Button>
                    <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))} disabled={zoom >= 3}><ZoomIn className="h-4 w-4 mr-2" /> Phóng to</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function BookingManager({ userProfile, highlightedBookingId, onHighlightCleared }: { userProfile: UserProfile, highlightedBookingId?: string | null, onHighlightCleared?: () => void }) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const { data: allBookings, loading: bookingsLoading, refetch: refetchBookings } = useSupabaseQuery<UserBooking>('bookings', undefined, { pollingInterval: 5000 });
    const [viewerState, setViewerState] = useState<{ isOpen: boolean, urls: string[], startIndex: number }>({ isOpen: false, urls: [], startIndex: 0 });

    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(() => {
        return [dayjs().startOf('day'), dayjs().add(3, 'month').endOf('day')];
    });
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(100);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all');
    const [selectedClubId, setSelectedClubId] = useState<string>('all');
    const [creationDateRange, setCreationDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

    const { data: allClubs } = useSupabaseQuery<Club>('clubs');
    const { data: owners, loading: ownersLoading } = useSupabaseQuery<UserProfile>(
        userProfile.role === 'admin' ? 'users' : null,
        (q) => q.eq('role', 'club_owner')
    );
    const loading = bookingsLoading || (userProfile.role === 'admin' && ownersLoading);

    const prevBookingsRef = useRef<UserBooking[] | null>(null);
    useEffect(() => {
        if (loading || !allBookings) return;
        if (prevBookingsRef.current === null) { prevBookingsRef.current = allBookings; return; }
        if (allBookings.length > prevBookingsRef.current.length) {
            const prevBookingIds = new Set(prevBookingsRef.current.map(b => b.id));
            const newBookings = allBookings.filter(b => !prevBookingIds.has(b.id));
            newBookings.forEach(booking => {
                if (booking.status === 'Chờ xác nhận') {
                    const isRelevant = userProfile.role === 'admin' || (userProfile.role === 'club_owner' && userProfile.managed_club_ids?.includes(booking.club_id));
                    if (isRelevant) { toast({ title: "Có lịch đặt mới!", description: `${booking.name} vừa đặt sân tại ${booking.club_name}.` }); }
                }
            });
        }
        prevBookingsRef.current = allBookings;
    }, [allBookings, loading, toast, userProfile]);

    const filteredBookings = useMemo(() => {
        if (!allBookings) return [];
        let bookingsToFilter = allBookings;
        if (userProfile.role === 'admin' && selectedOwnerId !== 'all') {
            const selectedOwner = owners?.find(o => o.id === selectedOwnerId);
            const ownerClubIds = selectedOwner?.managed_club_ids || [];
            bookingsToFilter = bookingsToFilter.filter(b => ownerClubIds.includes(b.club_id));
        } else if (userProfile.role === 'club_owner') {
            bookingsToFilter = bookingsToFilter.filter(b => userProfile.managed_club_ids?.includes(b.club_id));
        }
        const finalFiltered = bookingsToFilter.filter(booking => {
            const statusMatch = statusFilter === 'all' || booking.status === statusFilter;
            const clubMatch = selectedClubId === 'all' || booking.club_id === selectedClubId;
            let dateMatch = true;
            if (dateRange && dateRange[0] && dateRange[1]) {
                const bookingDate = dayjs(booking.date + 'T00:00:00');
                dateMatch = (bookingDate.isAfter(dateRange[0], 'day') || bookingDate.isSame(dateRange[0], 'day')) && (bookingDate.isBefore(dateRange[1], 'day') || bookingDate.isSame(dateRange[1], 'day'));
            }
            const term = searchTerm.trim().toLowerCase();
            const searchMatch = !term || (booking.phone || '').toLowerCase().includes(term) || (booking.name || '').toLowerCase().includes(term);
            const systemExcludeMatch = booking.phone.toLowerCase() !== 'hệ thống';
            let creationDateMatch = true;
            if (creationDateRange && creationDateRange[0] && creationDateRange[1]) {
                const createdAt = booking.created_at ? dayjs(booking.created_at) : null;
                if (createdAt) {
                    creationDateMatch = (createdAt.isAfter(creationDateRange[0], 'day') || createdAt.isSame(creationDateRange[0], 'day')) && (createdAt.isBefore(creationDateRange[1], 'day') || createdAt.isSame(creationDateRange[1], 'day'));
                } else { creationDateMatch = false; }
            }
            const isDeletedMatch = !booking.is_deleted;
            return statusMatch && dateMatch && searchMatch && clubMatch && systemExcludeMatch && creationDateMatch && isDeletedMatch;
        });
        return finalFiltered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }, [allBookings, userProfile, statusFilter, dateRange, selectedOwnerId, owners, searchTerm, selectedClubId, creationDateRange]);

    const groupedBookings = useMemo(() => {
        const groups: Record<string, any> = {};
        filteredBookings.forEach(booking => {
            const createdAtStr = booking.created_at ? Math.floor(new Date(booking.created_at).getTime() / 1000).toString() : 'no-time';
            const proofsKey = (booking.payment_proof_image_urls || []).sort().join(',');
            const key = booking.booking_group_id || `${booking.phone}-${booking.status}-${createdAtStr}-${proofsKey}`;
            if (!groups[key]) {
                groups[key] = { id: `group-${key}`, name: booking.name, phone: booking.phone, totalPrice: 0, count: 0, dates: [], bookingIds: [], paymentProofImageUrls: [], bookings: [], statuses: new Set(), slotsByDate: {} as Record<string, { time: string, courtName: string }[]>, latestCreatedAt: booking.created_at || null, bookingGroupId: booking.booking_group_id || null };
            }
            const g = groups[key];
            g.totalPrice += booking.total_price;
            g.count += 1;
            if (!g.dates.includes(booking.date)) g.dates.push(booking.date);
            g.bookingIds.push(booking.id);
            if (booking.payment_proof_image_urls) g.paymentProofImageUrls.push(...booking.payment_proof_image_urls);
            g.bookings.push(booking);
            g.statuses.add(booking.status);
            if (booking.created_at && (!g.latestCreatedAt || new Date(booking.created_at).getTime() > new Date(g.latestCreatedAt).getTime())) { g.latestCreatedAt = booking.created_at; }
            if (!g.slotsByDate[booking.date]) { g.slotsByDate[booking.date] = []; }
            booking.slots.forEach(s => {
                if (!g.slotsByDate[booking.date].some((existing: any) => existing.time === s.time && existing.courtName === s.court_name)) {
                    g.slotsByDate[booking.date].push({ time: s.time, courtName: s.court_name || '' });
                }
            });
        });
        return Object.values(groups).map((g: any) => ({
            ...g, dates: g.dates.sort((a: string, b: string) => b.localeCompare(a)),
            paymentProofImageUrls: Array.from(new Set(g.paymentProofImageUrls)),
            statusSummary: Array.from(g.statuses).join(', '),
            slotsByDate: Object.fromEntries(Object.entries(g.slotsByDate).map(([date, slots]: [string, any]) => [date, slots.sort((a: any, b: any) => a.time.localeCompare(b.time))]))
        }));
    }, [filteredBookings]);

    const pageCount = Math.ceil(groupedBookings.length / rowsPerPage);
    const paginatedBookings = useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        return groupedBookings.slice(startIndex, startIndex + rowsPerPage);
    }, [groupedBookings, page, rowsPerPage]);

    useEffect(() => {
        if (!highlightedBookingId || !allBookings || loading) return;
        const targetBooking = allBookings.find(b => b.id === highlightedBookingId);
        if (targetBooking) {
            if (statusFilter !== 'all') setStatusFilter('all');
            if (searchTerm !== '') setSearchTerm('');
            if (selectedOwnerId !== 'all') setSelectedOwnerId('all');
            if (selectedClubId !== 'all') setSelectedClubId('all');
            const bDate = dayjs(targetBooking.date + 'T00:00:00');
            if (!dateRange || !dateRange[0] || !dateRange[1] || bDate.isBefore(dateRange[0], 'day') || bDate.isAfter(dateRange[1], 'day')) { setDateRange([bDate.startOf('month'), bDate.endOf('month')]); }
        }
    }, [highlightedBookingId, allBookings, loading]);

    useEffect(() => {
        if (!highlightedBookingId || groupedBookings.length === 0) return;
        const groupIndex = groupedBookings.findIndex((g: any) => g.bookingIds.includes(highlightedBookingId));
        if (groupIndex !== -1) {
            const targetPage = Math.floor(groupIndex / rowsPerPage) + 1;
            if (page !== targetPage) { setPage(targetPage); return; }
            const activeGroup = groupedBookings[groupIndex];
            const timer = setTimeout(() => {
                const element = document.getElementById(`booking-${activeGroup.id}`);
                if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); const clearTimer = setTimeout(() => { onHighlightCleared?.(); }, 5000); return () => clearTimeout(clearTimer); }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [highlightedBookingId, groupedBookings, rowsPerPage, page]);

    const handleOpenImageViewer = (urls: string[], startIndex: number) => { setViewerState({ isOpen: true, urls, startIndex }); };

    const handleUpdateStatus = async (bookingIds: string[], status: 'Đã xác nhận' | 'Đã hủy') => {
        if (userProfile.role !== 'admin' && userProfile.role !== 'club_owner') {
            toast({ title: 'Lỗi!', description: 'Bạn không có quyền thực hiện hành động này.', variant: 'destructive' }); return;
        }
        try {
            const promises = bookingIds.map(id => supabase.from('bookings').update({ status }).eq('id', id));
            await Promise.all(promises);
            
            // If cancelling bookings, decrement the booking count
            if (status === 'Đã hủy') {
                // Get the club_id from the first booking to decrement counter
                const bookingsToCancel = allBookings?.filter(b => bookingIds.includes(b.id));
                if (bookingsToCancel && bookingsToCancel.length > 0) {
                    const clubId = bookingsToCancel[0].club_id;
                    try {
                        const { error: quotaError } = await supabase.rpc('decrement_booking_count', { 
                            p_club_id: clubId 
                        });
                        if (quotaError) {
                            console.error('Failed to decrement booking count:', quotaError);
                            // Don't fail the cancellation if quota tracking fails
                        }
                    } catch (quotaErr) {
                        console.error('Quota tracking error:', quotaErr);
                    }
                }
            }
            
            toast({ title: 'Cập nhật thành công!', description: `Đã đổi trạng thái cho các lịch đặt thành "${status}".` });
            refetchBookings();
        } catch (error) {
            console.error(error);
            toast({ title: 'Lỗi!', description: 'Không thể cập nhật một số trạng thái.', variant: 'destructive' });
        }
    };

    const handleDeleteBookings = async (bookingIds: string[]) => {
        if (userProfile.role !== 'admin' && userProfile.role !== 'club_owner') {
            toast({ title: 'Lỗi!', description: 'Bạn không có quyền thực hiện hành động này.', variant: 'destructive' }); return;
        }
        try {
            const promises = bookingIds.map(id => supabase.from('bookings').update({ is_deleted: true }).eq('id', id));
            await Promise.all(promises);
            toast({ title: 'Xóa thành công!', description: `Đã xóa các lịch đặt được chọn.` });
            refetchBookings();
        } catch (error) {
            console.error(error);
            toast({ title: 'Lỗi!', description: 'Không thể xóa một số lịch đặt.', variant: 'destructive' });
        }
    };

    const handleExportInvoice = async (group: any) => {
        toast({ title: 'Đang khởi tạo hóa đơn...', description: 'Vui lòng chờ trong giây lát.' });
        try {
            const firstBooking = group.bookings[0];
            const { data: clubData } = await supabase.from('clubs').select('*').eq('id', firstBooking.club_id).single();
            const qrUrl = clubData?.payment_qr_url || '/ma-qr.JPG';
            const orderId = group.bookingGroupId || group.bookingIds[0]?.slice(0, 8) || '';

            const slotRows: { date: string; details: string }[] = [];
            Object.entries(group.slotsByDate).forEach(([date, slots]: [string, any]) => {
                const byCourtMap: Record<string, string[]> = {};
                (slots as { time: string; courtName: string }[]).forEach((s) => {
                    if (!byCourtMap[s.courtName]) byCourtMap[s.courtName] = [];
                    byCourtMap[s.courtName].push(s.time);
                });
                const parts = Object.entries(byCourtMap).map(([courtName, times]) => {
                    const sorted = (times as string[]).sort();
                    const from = sorted[0];
                    const lastTime = sorted[sorted.length - 1];
                    const [h, m] = lastTime.split(':').map(Number);
                    const to = `${String(h).padStart(2, '0')}:${String(m + 30).padStart(2, '0')}`;
                    return `${from} - ${to} (${courtName})`;
                });
                slotRows.push({ date: format(new Date(date + 'T00:00:00'), 'dd/MM/yyyy'), details: parts.join(', ') });
            });

            const slotRowsHtml = slotRows.map((r, i) => `
                <tr style="border-bottom:1px solid #e5e7eb;">
                    <td style="padding:8px 12px;text-align:center;">${i + 1}</td>
                    <td style="padding:8px 12px;">${r.date}</td>
                    <td style="padding:8px 12px;">${r.details}</td>
                </tr>
            `).join('');

            const invoiceHtml = `
                <div id="invoice-render" style="width:800px;padding:40px;font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a1a;">
                    <div style="text-align:center;margin-bottom:24px;">
                        <h1 style="font-size:24px;font-weight:700;margin:0 0 4px;">HÓA ĐƠN ĐẶT SÂN</h1>
                        <p style="font-size:16px;font-weight:600;margin:0 0 2px;">${clubData?.name || firstBooking.club_name || ''}</p>
                        ${clubData?.address ? `<p style="font-size:13px;color:#666;margin:0;">${clubData.address}</p>` : ''}
                        ${clubData?.phone ? `<p style="font-size:13px;color:#666;margin:0;">ĐT: ${clubData.phone}</p>` : ''}
                    </div>
                    <hr style="border:none;border-top:2px solid #2980b9;margin:16px 0;" />
                    <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
                        <div>
                            <p style="margin:4px 0;font-size:14px;"><strong>Mã đơn:</strong> ${orderId}</p>
                            <p style="margin:4px 0;font-size:14px;"><strong>Khách hàng:</strong> ${group.name}</p>
                            <p style="margin:4px 0;font-size:14px;"><strong>SĐT:</strong> ${group.phone}</p>
                        </div>
                        <div style="text-align:right;">
                            <p style="margin:4px 0;font-size:14px;"><strong>Ngày tạo:</strong> ${group.latestCreatedAt ? format(new Date(group.latestCreatedAt), 'HH:mm dd/MM/yyyy') : ''}</p>
                            <p style="margin:4px 0;font-size:14px;"><strong>Trạng thái:</strong> ${group.statusSummary}</p>
                        </div>
                    </div>
                    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                        <thead>
                            <tr style="background:#2980b9;color:#fff;">
                                <th style="padding:10px 12px;text-align:center;width:50px;">STT</th>
                                <th style="padding:10px 12px;text-align:left;">Ngày</th>
                                <th style="padding:10px 12px;text-align:left;">Ca đặt</th>
                            </tr>
                        </thead>
                        <tbody>${slotRowsHtml}</tbody>
                    </table>
                    <div style="text-align:right;margin-bottom:20px;">
                        <p style="font-size:18px;font-weight:700;color:#2980b9;margin:0;">Tổng tiền: ${new Intl.NumberFormat('vi-VN').format(group.totalPrice)} VNĐ</p>
                    </div>
                    <div style="text-align:center;margin-top:16px;">
                        <p style="font-size:13px;color:#666;margin:0 0 8px;">Quét mã QR để thanh toán</p>
                        <img src="${qrUrl}" style="width:180px;height:180px;object-fit:contain;" crossorigin="anonymous" />
                    </div>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0 8px;" />
                    <p style="text-align:center;font-size:12px;color:#999;margin:0;">Cảm ơn quý khách đã sử dụng dịch vụ!</p>
                </div>
            `;

            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.innerHTML = invoiceHtml;
            document.body.appendChild(container);

            const invoiceEl = container.querySelector('#invoice-render') as HTMLElement;
            const canvas = await html2canvas(invoiceEl, { scale: 2, useCORS: true, allowTaint: true });
            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`hoa-don-${orderId || 'booking'}.pdf`);

            toast({ title: 'Thành công', description: 'Đã tạo hóa đơn PDF.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Lỗi', description: 'Không thể tạo hóa đơn.', variant: 'destructive' });
        }
    };

    return (
        <>
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4">
                    <div><CardTitle>Quản lý Lịch đặt</CardTitle><CardDescription>Xem, xác nhận hoặc hủy các lịch đặt sân.</CardDescription></div>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả</SelectItem><SelectItem value="Chờ xác nhận">Chờ xác nhận</SelectItem><SelectItem value="Đã xác nhận">Đã xác nhận</SelectItem><SelectItem value="Đã hủy">Đã hủy</SelectItem></SelectContent></Select>
                        <Input placeholder="Tìm theo tên hoặc SĐT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-[200px]" />
                        <AntdRegistry><ConfigProvider locale={viVN}>
                            <DatePicker.RangePicker value={dateRange} onChange={(dates) => setDateRange(dates as any)} format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} className="w-full sm:w-auto h-10" allowClear={true} variant="outlined" />
                        </ConfigProvider></AntdRegistry>
                        {userProfile.role === 'admin' && (
                            <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}><SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Lọc theo chủ club" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả chủ club</SelectItem>{owners?.map(o => <SelectItem key={o.id} value={o.id}>{o.email}</SelectItem>)}</SelectContent></Select>
                        )}
                        <Select value={selectedClubId} onValueChange={setSelectedClubId}><SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Lọc theo club" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả club</SelectItem>{allClubs?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground mb-4">Tổng: {groupedBookings.length} đơn đặt | Trang {page}/{pageCount || 1}</div>
                <Table>
                    <TableHeader><TableRow><TableHead>Mã đơn</TableHead><TableHead>Khách hàng</TableHead><TableHead>Ca đặt</TableHead><TableHead>Bằng chứng CK</TableHead><TableHead>Tổng tiền</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày tạo</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading && Array.from({ length: 3 }).map((_, i) => (<TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>))}
                        {paginatedBookings.map((group: any) => {
                            const isHighlighted = highlightedBookingId && group.bookingIds.includes(highlightedBookingId);
                            return (
                                <TableRow key={group.id} id={`booking-${group.id}`} className={cn(isHighlighted && "bg-primary/10 animate-pulse")}>
                                    <TableCell><div className="text-xs font-mono text-muted-foreground">{group.bookingGroupId || group.bookingIds[0]?.slice(0, 8) || '—'}</div></TableCell>
                                    <TableCell><div className="font-medium">{group.name}</div><div className="text-xs text-muted-foreground">{group.phone}</div></TableCell>
                                    <TableCell>
                                        <div className="text-xs space-y-1.5">
                                            {Object.entries(group.slotsByDate).map(([date, slots]: [string, any]) => {
                                                const byCourtMap: Record<string, string[]> = {};
                                                (slots as { time: string; courtName: string }[]).forEach((s) => {
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
                                                    <div key={date}>
                                                        <span className="font-medium">{format(new Date(date + 'T00:00:00'), 'dd/MM/yyyy')}:</span>
                                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                                            {ranges.map((r, i) => (
                                                                <span key={i} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                                                                    {r.from}-{r.to} ({r.courtName})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {group.paymentProofImageUrls.length > 0 ? (
                                            <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => handleOpenImageViewer(group.paymentProofImageUrls, 0)}>Xem ảnh ({group.paymentProofImageUrls.length})</Button>
                                        ) : <span className="text-xs text-muted-foreground">—</span>}
                                    </TableCell>
                                    <TableCell className="font-medium">{new Intl.NumberFormat('vi-VN').format(group.totalPrice)}đ</TableCell>
                                    <TableCell><Badge className={cn(
                                        group.statusSummary.includes('Đã xác nhận') ? 'bg-green-500 text-white border-green-500 hover:bg-green-500/80' :
                                        group.statusSummary.includes('Chờ') ? 'bg-gray-400 text-white border-gray-400 hover:bg-gray-400/80' :
                                        'bg-red-500 text-white border-red-500 hover:bg-red-500/80'
                                    )}>{group.statusSummary}</Badge></TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{group.latestCreatedAt ? format(new Date(group.latestCreatedAt), 'HH:mm dd/MM/yyyy', { locale: vi }) : '...'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(group.bookingIds, 'Đã xác nhận')}><CheckCircle2 className="mr-2 h-4 w-4" />Xác nhận</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(group.bookingIds, 'Đã hủy')} className="text-destructive">Hủy đặt</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleExportInvoice(group)}><FileDown className="mr-2 h-4 w-4" />Xuất hóa đơn</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDeleteBookings(group.bookingIds)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {!loading && groupedBookings.length === 0 && (<TableRow><TableCell colSpan={8} className="h-24 text-center">Không có lịch đặt nào.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
                {pageCount > 1 && (
                    <div className="flex items-center justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm">{page} / {pageCount}</span>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                )}
            </CardContent>
        </Card>
        <ImageViewer imageUrls={viewerState.urls} startIndex={viewerState.startIndex} isOpen={viewerState.isOpen} onClose={() => setViewerState({ ...viewerState, isOpen: false })} />
        </>
    );
}
