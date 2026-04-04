'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { getDay } from 'date-fns';
import { DatePicker, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { AntdRegistry } from '@ant-design/nextjs-registry';
dayjs.locale('vi');
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { UserBooking, Club, Court, UserProfile } from '@/lib/types';
import { timeSlots } from '@/lib/data';
import { getPriceForSlot } from '@/lib/pricing-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, CalendarDays, Newspaper, Users, Clock, Settings2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// (Removed local getPriceForSlot - now in pricing-utils.ts)

function StatusLegend() {
    const legendItems = [
        { label: 'Trống', className: 'bg-background border' },
        { label: 'Đã đặt', className: 'bg-destructive/80' },
        { label: 'Khóa', className: 'bg-muted line-through' },
        { label: 'Sự kiện', className: 'bg-event/80' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-2 text-xs text-muted-foreground pb-2">
            {legendItems.map(item => (
                <div key={item.label} className="flex items-center gap-2">
                    <div className={cn('h-3 w-3 rounded-sm border', item.className)} />
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );
}

export function ScheduleManager({ userProfile }: { userProfile: UserProfile }) {
    const supabase = useSupabase();
    const [date, setDate] = useState<Date>(new Date());

    const { data: allClubs, loading: clubsLoading } = useSupabaseQuery<Club>('clubs');

    const clubs = useMemo(() => {
        if (!allClubs) return [];
        if (userProfile.role === 'club_owner') {
            return allClubs.filter(c => userProfile.managed_club_ids?.includes(c.id));
        }
        return allClubs;
    }, [allClubs, userProfile]);

    const [selectedClubId, setSelectedClubId] = useState<string>('');

    useEffect(() => {
        if (clubs.length > 0 && !selectedClubId) {
            setSelectedClubId(clubs[0].id);
        }
    }, [clubs, selectedClubId]);

    const dateStr = format(date, 'yyyy-MM-dd');

    const { data: courts, loading: courtsLoading } = useSupabaseQuery<Court>(
        selectedClubId ? 'courts' : null,
        (q) => q.eq('club_id', selectedClubId),
        { deps: [selectedClubId] }
    );
    const sortedCourts = useMemo(() => courts?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [courts]);

    const { data: dateBookings, loading: bookingsLoading, refetch: refetchScheduleBookings } = useSupabaseQuery<UserBooking>(
        selectedClubId ? 'bookings' : null,
        (q) => q.eq('club_id', selectedClubId).eq('date', dateStr),
        { deps: [selectedClubId, dateStr] }
    );

    const loading = clubsLoading || (selectedClubId && (courtsLoading || bookingsLoading));

    const getBookingForSlot = (courtId: string, time: string) => {
        if (!dateBookings) return null;
        return dateBookings.find(b =>
            b.status !== 'Đã hủy' &&
            b.slots.some(s => s.court_id === courtId && s.time === time)
        );
    };

    const currentClub = useMemo(() => clubs.find(c => c.id === selectedClubId), [clubs, selectedClubId]);

    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [selectedSlotData, setSelectedSlotData] = useState<{ courtId: string, courtName: string, time: string, booking?: UserBooking } | null>(null);
    const { toast } = useToast();

    const handleSlotClick = (courtId: string, courtName: string, time: string, booking?: UserBooking) => {
        setSelectedSlotData({ courtId, courtName, time, booking });
        setActionDialogOpen(true);
    };

    const handleAction = async (action: 'Khóa' | 'Sự kiện') => {
        if (!selectedSlotData || !selectedClubId || !currentClub) return;

        try {
            const bookingData = {
                club_id: selectedClubId,
                club_name: currentClub.name,
                date: format(date, 'yyyy-MM-dd'),
                slots: [{ court_id: selectedSlotData.courtId, time: selectedSlotData.time, court_name: selectedSlotData.courtName }],
                total_price: 0,
                status: action,
                name: action === 'Khóa' ? 'LỊCH KHÓA' : 'SỰ KIỆN',
                phone: 'Hệ thống',
            };

            const { error } = await supabase.from('bookings').insert(bookingData);
            if (error) throw error;
            toast({ title: 'Thành công', description: `Đã ${action.toLowerCase()} khung giờ.` });
            setActionDialogOpen(false);
            refetchScheduleBookings();
        } catch (error) {
            toast({ title: 'Lỗi', description: 'Không thể thực hiện thao tác.', variant: 'destructive' });
        }
    };

    const handleUnlock = async () => {
        if (!selectedSlotData?.booking || !currentClub) return;

        const booking = selectedSlotData.booking;
        try {
            const remainingSlots = booking.slots.filter(s =>
                !(s.court_id === selectedSlotData.courtId && s.time === selectedSlotData.time)
            );

            if (remainingSlots.length === 0) {
                const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
                if (error) throw error;
            } else {
                let newTotalPrice = booking.total_price;
                if (booking.phone !== 'Hệ thống') {
                    newTotalPrice = remainingSlots.reduce((sum, slot) => {
                        return sum + getPriceForSlot(slot.time, date, currentClub.pricing);
                    }, 0);
                }

                const { error } = await supabase.from('bookings').update({
                    slots: remainingSlots,
                    total_price: newTotalPrice
                }).eq('id', booking.id);
                if (error) throw error;
            }

            toast({ title: 'Thành công', description: 'Đã gỡ bỏ khung giờ chọn.' });
            setActionDialogOpen(false);
            refetchScheduleBookings();
        } catch (error) {
            console.error(error);
            toast({ title: 'Lỗi', description: 'Không thể xử lý yêu cầu.', variant: 'destructive' });
        }
    };

    const [bulkActionOpen, setBulkActionOpen] = useState(false);
    const [bulkConfig, setBulkConfig] = useState<{
        courtId: string;
        startTime: string;
        endTime: string;
        type: 'Khóa' | 'Sự kiện' | 'Đã đặt' | 'Mở khóa';
        note: string;
    }>({
        courtId: '',
        startTime: '05:00',
        endTime: '22:00',
        type: 'Khóa',
        note: ''
    });

    const [isDragging, setIsDragging] = useState(false);
    const [dragSelection, setDragSelection] = useState<{
        courtId: string;
        startIdx: number;
        endIdx: number;
    } | null>(null);

    const handleMouseDown = (courtId: string, idx: number) => {
        setIsDragging(true);
        setDragSelection({ courtId, startIdx: idx, endIdx: idx });
    };

    const handleMouseEnter = (courtId: string, idx: number) => {
        if (isDragging && dragSelection && dragSelection.courtId === courtId) {
            setDragSelection({ ...dragSelection, endIdx: idx });
        }
    };

    const handleMouseUp = () => {
        if (isDragging && dragSelection) {
            const { courtId, startIdx, endIdx } = dragSelection;
            const realStart = Math.min(startIdx, endIdx);
            const realEnd = Math.max(startIdx, endIdx);

            if (realStart !== realEnd) {
                setBulkConfig({
                    ...bulkConfig,
                    courtId,
                    startTime: timeSlots[realStart],
                    endTime: timeSlots[realEnd + 1] || timeSlots[48],
                    type: 'Khóa',
                    note: ''
                });
                setBulkActionOpen(true);
            }
        }
        setIsDragging(false);
        setDragSelection(null);
    };

    useEffect(() => {
        if (courts && courts.length > 0 && !bulkConfig.courtId) {
            setBulkConfig(prev => ({ ...prev, courtId: courts[0].id }));
        }
    }, [courts]);

    const handleBulkSubmit = async () => {
        if (!selectedClubId || !currentClub) return;

        const startIdx = timeSlots.indexOf(bulkConfig.startTime);
        const endIdx = timeSlots.indexOf(bulkConfig.endTime);

        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
            toast({ title: 'Lỗi', description: 'Thời gian kết thúc phải sau thời gian bắt đầu.', variant: 'destructive' });
            return;
        }

        const selectedCourt = courts?.find(c => c.id === bulkConfig.courtId);
        if (!selectedCourt) {
            toast({ title: 'Lỗi', description: 'Vui lòng chọn sân.', variant: 'destructive' });
            return;
        }

        const slotsToAdd = timeSlots.slice(startIdx, endIdx).map(time => ({
            court_id: selectedCourt.id,
            time: time,
            court_name: selectedCourt.name
        }));

        try {
            if (bulkConfig.type === 'Mở khóa') {
                if (!dateBookings) return;

                const overlappingBookings = dateBookings.filter(b =>
                    b.status !== 'Đã hủy' &&
                    b.slots.some(s =>
                        s.court_id === selectedCourt.id &&
                        timeSlots.indexOf(s.time) >= startIdx &&
                        timeSlots.indexOf(s.time) < endIdx
                    )
                );

                for (const b of overlappingBookings) {
                    const remainingSlots = b.slots.filter(s =>
                        !(s.court_id === selectedCourt.id &&
                            timeSlots.indexOf(s.time) >= startIdx &&
                            timeSlots.indexOf(s.time) < endIdx)
                    );

                    if (remainingSlots.length === 0) {
                        await supabase.from('bookings').delete().eq('id', b.id);
                    } else {
                        let newTotalPrice = b.total_price;
                        if (b.phone !== 'Hệ thống') {
                            newTotalPrice = remainingSlots.reduce((sum, slot) => {
                                return sum + getPriceForSlot(slot.time, date, currentClub.pricing);
                            }, 0);
                        }
                        await supabase.from('bookings').update({
                            slots: remainingSlots,
                            total_price: newTotalPrice
                        }).eq('id', b.id);
                    }
                }
            } else if (bulkConfig.type === 'Đã đặt') {
                const totalPrice = slotsToAdd.reduce((sum, slot) => {
                    return sum + getPriceForSlot(slot.time, date, currentClub.pricing);
                }, 0);

                const bookingData = {
                    club_id: selectedClubId,
                    club_name: currentClub.name,
                    date: format(date, 'yyyy-MM-dd'),
                    slots: slotsToAdd,
                    total_price: totalPrice,
                    status: 'Đã xác nhận',
                    name: bulkConfig.note || 'Khách vãng lai (Admin đặt)',
                    phone: 'Tại quầy',
                };

                await supabase.from('bookings').insert(bookingData);

                // Increment booking count for quota tracking
                try {
                    const { error: quotaError } = await supabase.rpc('increment_booking_count', { 
                        p_club_id: selectedClubId 
                    });
                    if (quotaError) {
                        console.error('Failed to increment booking count:', quotaError);
                    }

                    // Check quota and send notifications if thresholds are reached
                    const { data: quotaData, error: quotaCheckError } = await supabase.rpc('check_booking_quota', {
                        p_club_id: selectedClubId
                    });

                    if (!quotaCheckError && quotaData && quotaData.length > 0) {
                        const quota = quotaData[0];
                        const usagePercentage = quota.usage_percentage;

                        // Send notification if we've crossed a threshold (80%, 90%, or 100%)
                        if (usagePercentage >= 80) {
                            // Get club owner email for notification
                            const { data: clubData } = await supabase
                                .from('clubs')
                                .select('name, owner_id')
                                .eq('id', selectedClubId)
                                .single();

                            if (clubData && clubData.owner_id) {
                                // Get owner profile
                                const { data: ownerProfile } = await supabase
                                    .from('profiles')
                                    .select('email')
                                    .eq('id', clubData.owner_id)
                                    .single();

                                if (ownerProfile?.email) {
                                    // Call notification API endpoint
                                    try {
                                        await fetch('/api/notifications/quota-warning', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                club_name: clubData.name,
                                                club_owner_email: ownerProfile.email,
                                                current_count: quota.current_count,
                                                max_allowed: quota.max_allowed,
                                                usage_percentage: usagePercentage,
                                                overage_count: quota.overage_count,
                                                overage_fee: quota.overage_fee,
                                            }),
                                        });
                                    } catch (notifError) {
                                        console.error('Failed to send quota notification:', notifError);
                                    }
                                }
                            }
                        }
                    }
                } catch (quotaErr) {
                    console.error('Quota tracking error:', quotaErr);
                }

            } else {
                const bookingData = {
                    club_id: selectedClubId,
                    club_name: currentClub.name,
                    date: format(date, 'yyyy-MM-dd'),
                    slots: slotsToAdd,
                    total_price: 0,
                    status: bulkConfig.type,
                    name: bulkConfig.type === 'Khóa' ? 'LỊCH KHÓA' : (bulkConfig.note || 'SỰ KIỆN'),
                    phone: 'Hệ thống',
                };
                await supabase.from('bookings').insert(bookingData);
            }

            toast({ title: 'Thành công', description: `Đã thiết lập ${bulkConfig.type.toLowerCase()} cho ${slotsToAdd.length} khung giờ.` });
            setBulkActionOpen(false);
            refetchScheduleBookings();
        } catch (error) {
            toast({ title: 'Lỗi', description: 'Không thể thực hiện thao tác.', variant: 'destructive' });
        }
    };

    return (
        <Card className="h-full flex flex-col border-none shadow-none sm:border sm:shadow overflow-hidden">
            <CardHeader className="px-0 sm:px-6">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div className="space-y-1">
                        <CardTitle>Lịch sân chi tiết</CardTitle>
                        <CardDescription>Theo dõi trực quan trạng thái sân và khách đặt trong ngày.</CardDescription>
                        <div className="pt-2"><StatusLegend /></div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                        <Button variant="outline" className="hidden sm:flex" onClick={() => setBulkActionOpen(true)}>
                            <Settings2 className="mr-2 h-4 w-4" />Thiết lập nhanh
                        </Button>
                        <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                            <SelectTrigger className="w-full sm:w-[250px]"><SelectValue placeholder="Chọn câu lạc bộ" /></SelectTrigger>
                            <SelectContent>{clubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <AntdRegistry><ConfigProvider locale={viVN}>
                            <DatePicker className="w-full sm:w-[200px] h-10" value={date ? dayjs(date) : null} onChange={(d) => d && setDate(d.toDate())} format="DD/MM/YYYY" placeholder="Chọn ngày" allowClear={false} />
                        </ConfigProvider></AntdRegistry>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col rounded-md border bg-background">
                <div className="flex-1 w-full overflow-auto thin-scrollbar select-none" onMouseUp={handleMouseUp} onMouseLeave={() => isDragging && setIsDragging(false)}>
                    <div className="relative min-w-full inline-block">
                        <div className="flex sticky top-0 z-[2]">
                            <div className="flex-shrink-0 w-28 h-12 border-r border-b bg-background font-bold text-xs flex items-center justify-center sticky left-0 z-[3] text-primary">Sân / Giờ</div>
                            <div className="relative border-b h-12 bg-card flex-1 overflow-visible">
                                <div className="absolute inset-x-0 bottom-0 flex h-full">
                                    {timeSlots.map((time, i) => (
                                        <div key={time} className="absolute text-[10px] font-bold text-muted-foreground flex flex-col items-center" style={{ left: `${i * 128}px`, transform: 'translateX(-50%)', width: '40px' }}>
                                            <div className="h-4 w-px bg-border mt-2"></div>
                                            <span className="mt-1 leading-none">{time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {(() => {
                            const courtBookingsSummary = (sortedCourts || []).reduce((acc, court) => {
                                const courtSlots = (dateBookings || []).filter(b => b.status !== 'Đã hủy')
                                    .flatMap(b => b.slots.filter(s => s.court_id === court.id).map(s => ({ ...s, booking: b })));
                                if (courtSlots.length > 0) {
                                    acc[court.id] = {
                                        totalSlots: courtSlots.length,
                                        customers: Array.from(new Set(courtSlots.filter(s => s.booking.name !== 'LỊCH KHÓA' && s.booking.name !== 'SỰ KIỆN').map(s => s.booking.name))),
                                        hasSpecial: courtSlots.some(s => s.booking.status === 'Khóa' || s.booking.status === 'Sự kiện')
                                    };
                                }
                                return acc;
                            }, {} as Record<string, { totalSlots: number, customers: string[], hasSpecial: boolean }>);

                            return sortedCourts?.map(court => {
                                const summary = courtBookingsSummary[court.id];
                                const hasBookings = !!summary;
                                return (
                                    <div key={court.id} className="flex hover:bg-muted/5 transition-colors">
                                        <div className={cn("flex-shrink-0 w-28 p-2 border-r border-b font-semibold text-sm flex flex-col items-center justify-center bg-background sticky left-0 z-[1] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors", hasBookings && "bg-primary/[0.04] border-l-4 border-l-primary")}>
                                            <span className={cn("text-center leading-tight truncate w-full px-1", hasBookings ? "text-primary font-bold" : "text-foreground")}>{court.name}</span>
                                            {hasBookings && (
                                                <TooltipProvider delayDuration={300}><Tooltip><TooltipTrigger asChild>
                                                    <div className="mt-1.5 flex flex-col items-center gap-0.5 cursor-help">
                                                        <div className="flex items-center gap-1 text-[10px] text-primary/80 font-medium"><Clock className="w-2.5 h-2.5" /><span>{summary.totalSlots} suất</span></div>
                                                        {summary.customers.length > 0 && (<div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Users className="w-2.5 h-2.5" /><span>{summary.customers.length} khách</span></div>)}
                                                    </div>
                                                </TooltipTrigger><TooltipContent side="right" className="p-3 w-56">
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-bold border-b pb-1">Chi tiết {court.name}</p>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Tổng thời gian:</span><span className="font-bold text-primary">{summary.totalSlots * 0.5} giờ</span></div>
                                                            {summary.customers.length > 0 && (<div className="space-y-1"><span className="text-[10px] text-muted-foreground italic">Khách đặt:</span><div className="flex flex-wrap gap-1">{summary.customers.map(c => (<Badge key={c} variant="secondary" className="text-[9px] px-1 h-4">{c}</Badge>))}</div></div>)}
                                                            {summary.hasSpecial && (<Badge variant="outline" className="text-[9px] w-full justify-center bg-muted/50">Có lịch khóa/sự kiện</Badge>)}
                                                        </div>
                                                    </div>
                                                </TooltipContent></Tooltip></TooltipProvider>
                                            )}
                                        </div>
                                        <div className="flex">
                                            {timeSlots.slice(0, 48).map((time, idx) => {
                                                const booking = getBookingForSlot(court.id, time);
                                                const price = getPriceForSlot(time, date, currentClub?.pricing);
                                                const isBlocked = price === 0;
                                                const isSelected = dragSelection?.courtId === court.id && idx >= Math.min(dragSelection.startIdx, dragSelection.endIdx) && idx <= Math.max(dragSelection.startIdx, dragSelection.endIdx);

                                                if (booking) {
                                                    const isSystemLock = booking.status === 'Khóa';
                                                    const isEvent = booking.status === 'Sự kiện';
                                                    return (
                                                        <div key={time} onMouseDown={() => handleMouseDown(court.id, idx)} onMouseEnter={() => handleMouseEnter(court.id, idx)}
                                                            onClick={() => { if (!isDragging && dragSelection === null) handleSlotClick(court.id, court.name, time, booking); }}
                                                            className={cn("flex-shrink-0 w-32 p-1 border-r border-b h-24 text-xs overflow-hidden transition-all group relative cursor-pointer",
                                                                isSystemLock ? "bg-muted text-muted-foreground hover:bg-muted/80 shadow-inner" : isEvent ? "bg-event text-event-foreground hover:bg-event/90" : "bg-destructive/80 text-destructive-foreground hover:bg-destructive",
                                                                isSelected && "ring-2 ring-inset ring-primary z-10 opacity-70")}>
                                                            <div className="flex flex-col h-full justify-between">
                                                                <div><div className="font-bold truncate">{booking.name}</div><div className="truncate opacity-90 text-[10px]">{booking.phone}</div></div>
                                                                <Badge variant="outline" className={cn("text-[10px] h-5 px-2 w-fit border-current scale-90 origin-left font-bold capitalize", (isSystemLock || isEvent) ? "bg-background/20" : "border-destructive-foreground/50 text-destructive-foreground")}>{booking.status}</Badge>
                                                            </div>
                                                        </div>
                                                    );
                                                } else if (isBlocked) {
                                                    return (
                                                        <div key={time} onMouseDown={() => handleMouseDown(court.id, idx)} onMouseEnter={() => handleMouseEnter(court.id, idx)}
                                                            className={cn("flex-shrink-0 w-32 border-r border-b h-24 flex items-center justify-center relative transition-colors cursor-pointer", isSelected ? "bg-primary/20 ring-1 ring-inset ring-primary/30" : "bg-muted/30 opacity-40")}>
                                                            <div className="w-full h-px bg-muted-foreground/20 rotate-12 absolute" />
                                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">KHÓA GIỜ</span>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div key={time} onMouseDown={() => handleMouseDown(court.id, idx)} onMouseEnter={() => handleMouseEnter(court.id, idx)}
                                                            onClick={() => { if (!isDragging && dragSelection === null) handleSlotClick(court.id, court.name, time); }}
                                                            className={cn("flex-shrink-0 w-32 border-r border-b h-24 transition-colors cursor-pointer group", isSelected ? "bg-primary/20 ring-1 ring-inset ring-primary/30" : "bg-primary/[0.03] hover:bg-primary/5")}>
                                                            <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><PlusCircle className="h-4 w-4 text-primary/40" /></div>
                                                        </div>
                                                    );
                                                }
                                            })}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        {clubs.length === 0 && <div className="p-8 text-center text-muted-foreground">Bạn chưa quản lý câu lạc bộ nào.</div>}
                        {loading && dateBookings === undefined && <div className="p-8 text-center"><Skeleton className="w-[200px] h-4 mx-auto" /></div>}
                    </div>
                </div>
            </CardContent>

            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>Quản lý khung giờ</DialogTitle><DialogDescription>{selectedSlotData?.courtName} - {selectedSlotData?.time} ngày {date && format(date, 'dd/MM/yyyy')}</DialogDescription></DialogHeader>
                    {selectedSlotData?.booking ? (
                        <div className="py-4 space-y-4">
                            <div className="rounded-lg border p-4 space-y-2 bg-muted/5">
                                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Trạng thái:</span>
                                    <Badge className={cn(selectedSlotData.booking.status === 'Khóa' ? "bg-muted text-muted-foreground" : selectedSlotData.booking.status === 'Sự kiện' ? "bg-event text-event-foreground" : "bg-destructive text-destructive-foreground")}>{selectedSlotData.booking.status}</Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Thông tin:</span><span className="font-medium">{selectedSlotData.booking.name}</span></div>
                                {selectedSlotData.booking.phone !== 'Hệ thống' && (<div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">SĐT:</span><span className="font-medium">{selectedSlotData.booking.phone}</span></div>)}
                            </div>
                            {(selectedSlotData.booking.status === 'Khóa' || selectedSlotData.booking.status === 'Sự kiện') && (
                                <Button variant="destructive" className="w-full" onClick={handleUnlock}><Trash2 className="mr-2 h-4 w-4" /> Gỡ bỏ (Mở khóa)</Button>
                            )}
                        </div>
                    ) : (
                        <div className="py-6 flex flex-col gap-3">
                            <Button className="w-full h-12 text-base justify-start px-6" variant="outline" onClick={() => handleAction('Khóa')}><CalendarDays className="mr-3 h-5 w-5 text-muted-foreground" /><span>Khóa khung giờ (Bận)</span></Button>
                            <Button className="w-full h-12 text-base justify-start px-6 bg-event hover:bg-event/90 text-event-foreground border-none" onClick={() => handleAction('Sự kiện')}><Newspaper className="mr-3 h-5 w-5" /><span>Đặt làm Sự kiện</span></Button>
                        </div>
                    )}
                    <DialogFooter><DialogClose asChild><Button variant="ghost">Hủy</Button></DialogClose></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Thiết lập khung giờ hàng loạt</DialogTitle><DialogDescription>Khóa hoặc tạo sự kiện cho nhiều khung giờ cùng lúc.</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="court" className="text-right">Sân</Label>
                            <Select value={bulkConfig.courtId} onValueChange={(val) => setBulkConfig({ ...bulkConfig, courtId: val })}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Chọn sân" /></SelectTrigger>
                                <SelectContent>{sortedCourts?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Thời gian</Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Select value={bulkConfig.startTime} onValueChange={(val) => setBulkConfig({ ...bulkConfig, startTime: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="h-[200px]">{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                                <span>-</span>
                                <Select value={bulkConfig.endTime} onValueChange={(val) => setBulkConfig({ ...bulkConfig, endTime: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="h-[200px]">{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Loại</Label>
                            <Select value={bulkConfig.type} onValueChange={(val: any) => setBulkConfig({ ...bulkConfig, type: val })}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Khóa">Khóa (Bận)</SelectItem><SelectItem value="Sự kiện">Sự kiện</SelectItem><SelectItem value="Đã đặt">Đã đặt (Khách đặt)</SelectItem><SelectItem value="Mở khóa" className="text-destructive font-bold">Mở khóa / Gỡ bỏ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {bulkConfig.type === 'Đã đặt' && (<div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="note-booking" className="text-right">Tên KH</Label><Input id="note-booking" value={bulkConfig.note} onChange={(e) => setBulkConfig({ ...bulkConfig, note: e.target.value })} className="col-span-3" placeholder="Tên khách hàng (Mặc định: Khách vãng lai)" /></div>)}
                        {bulkConfig.type === 'Sự kiện' && (<div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="note" className="text-right">Tên SK</Label><Input id="note" value={bulkConfig.note} onChange={(e) => setBulkConfig({ ...bulkConfig, note: e.target.value })} className="col-span-3" placeholder="Ví dụ: Giải đấu..." /></div>)}
                    </div>
                    <DialogFooter><DialogClose asChild><Button variant="ghost">Hủy</Button></DialogClose><Button type="submit" onClick={handleBulkSubmit}>Xác nhận</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
