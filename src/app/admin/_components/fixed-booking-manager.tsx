'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addMonths, startOfMonth, parse, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { Club, UserProfile, Court, FixedMonthlyConfig, UserBooking } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, Pencil, CalendarDays, Loader2, PlayCircle, Info, Search, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { fixedMonthlyConfigSchema, type FixedMonthlyConfigSchema } from './schemas';
import { cn } from '@/lib/utils';
import { calculateRangePrice, formatVND, addMinutesToTime } from '@/lib/pricing-utils';

const DAYS_OF_WEEK = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
    { value: 0, label: 'Chủ Nhật' },
];

export function FixedBookingManager({ userProfile }: { userProfile: UserProfile }) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const [selectedClubId, setSelectedClubId] = useState<string>('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<FixedMonthlyConfig | undefined>(undefined);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [configToDelete, setConfigToDelete] = useState<FixedMonthlyConfig | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isGeneratingAuto, setIsGeneratingAuto] = useState(false);

    const { data: allClubs, loading: clubsLoading } = useSupabaseQuery<Club>('clubs');

    const clubs = useMemo(() => {
        if (!allClubs) return [];
        if (userProfile.role === 'club_owner') {
            return allClubs.filter(c => userProfile.managed_club_ids?.includes(c.id));
        }
        return allClubs;
    }, [allClubs, userProfile]);

    useEffect(() => {
        if (clubs.length > 0 && !selectedClubId) {
            setSelectedClubId(clubs[0].id);
        }
    }, [clubs, selectedClubId]);

    const currentClub = useMemo(() => clubs.find(c => c.id === selectedClubId), [clubs, selectedClubId]);

    const { data: configs, loading: configsLoading, refetch: refetchConfigs } = useSupabaseQuery<FixedMonthlyConfig>(
        selectedClubId ? 'fixed_monthly_configs' : null,
        (q) => q.eq('club_id', selectedClubId).order('created_at', { ascending: false }),
        { deps: [selectedClubId] }
    );

    const { data: bookings, loading: bookingsLoading, refetch: refetchBookings } = useSupabaseQuery<UserBooking>(
        selectedClubId ? 'bookings' : null,
        (q) => q.eq('club_id', selectedClubId).ilike('booking_group_id', 'FIXED-%').is('is_deleted', false),
        { deps: [selectedClubId] }
    );

    const { data: courts } = useSupabaseQuery<Court>(
        selectedClubId ? 'courts' : null,
        (q) => q.eq('club_id', selectedClubId),
        { deps: [selectedClubId] }
    );

    // Auto-generation logic when admin visits
    useEffect(() => {
        const autoGenerate = async () => {
            if (!selectedClubId || !configs || configs.length === 0 || isGeneratingAuto) return;
            
            const currentMonth = format(new Date(), 'yyyy-MM');
            let hasAnyAutoRenewPending = false;

            // Check if any config with auto-renew doesn't have current month generated
            configs.forEach(config => {
                if (config.is_auto_renew && config.last_generated_month !== currentMonth) {
                    hasAnyAutoRenewPending = true;
                }
            });

            if (hasAnyAutoRenewPending) {
                setIsGeneratingAuto(true);
                try {
                    const { data, error } = await supabase.rpc('generate_monthly_bookings', {
                        p_club_id: selectedClubId,
                        p_year_month: currentMonth
                    });
                    if (error) throw error;
                    
                    const result = data[0] || data;
                    if (result.total_created > 0) {
                        toast({
                            title: 'Tự động tạo lịch',
                            description: `Hệ thống đã tự động gia hạn và tạo ${result.total_created} lịch mới cho tháng ${currentMonth}.`,
                        });
                        refetchConfigs();
                        refetchBookings();
                    }
                } catch (err) {
                    console.error('Auto-generate error:', err);
                } finally {
                    setIsGeneratingAuto(false);
                }
            }
        };

        autoGenerate();
    }, [selectedClubId, configs, supabase, toast, refetchConfigs, refetchBookings]);

    const filteredConfigs = useMemo(() => {
        if (!configs) return [];
        return configs.filter(c => 
            c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.customer_phone?.includes(searchTerm) ||
            courts?.find(ct => ct.id === c.court_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [configs, searchTerm, courts]);

    const handleDelete = async () => {
        if (!configToDelete) return;
        const { error } = await supabase.from('fixed_monthly_configs').delete().eq('id', configToDelete.id);
        if (error) {
            toast({ title: 'Lỗi', description: 'Không thể xóa cấu hình.', variant: 'destructive' });
        } else {
            toast({ title: 'Thành công', description: 'Đã xóa cấu hình lịch cố định.' });
            refetchConfigs();
        }
        setDeleteAlertOpen(false);
        setConfigToDelete(null);
    };

    const handleManualGenerate = async (month: string) => {
        if (!selectedClubId) return;
        try {
            const { data, error } = await supabase.rpc('generate_monthly_bookings', {
                p_club_id: selectedClubId,
                p_year_month: month
            });

            if (error) throw error;

            const result = data[0] || data;
            toast({
                title: 'Hoàn tất tạo lịch',
                description: `Đã tạo ${result.total_created} lịch mới cho tháng ${month}.`,
            });
            refetchConfigs();
            refetchBookings();
        } catch (error: any) {
            toast({ title: 'Lỗi', description: error.message || 'Không thể tạo lịch.', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6 flex-1 flex flex-col min-h-0 bg-slate-50/50 p-4 md:p-6 rounded-2xl border border-slate-200">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <CalendarDays className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Lịch Cố Định & Hợp Đồng</h1>
                        <p className="text-sm text-slate-500">Tự động hóa việc tạo lịch định kỳ hàng tháng cho khách quen.</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                        <SelectTrigger className="w-full md:min-w-[280px] bg-white shadow-sm border-slate-200 rounded-xl">
                            <SelectValue placeholder="Chọn câu lạc bộ" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {clubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Button 
                        variant="default" 
                        className="w-full md:w-auto rounded-xl shadow-md transition-all hover:translate-y-[-1px] font-semibold"
                        onClick={() => { setSelectedConfig(undefined); setDialogOpen(true); }}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Thêm Cấu Hình
                    </Button>
                </div>
            </div>

            {/* Help/Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-sm rounded-2xl overflow-hidden group">
                    <div className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <span className="font-bold">1</span>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">Thiết lập cấu hình</p>
                            <p className="text-xs text-slate-500">Thứ, Giờ, Sân cho khách quen</p>
                        </div>
                    </div>
                </Card>
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-sm rounded-2xl overflow-hidden group">
                    <div className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <span className="font-bold">2</span>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">Sinh lịch tự động</p>
                            <p className="text-xs text-slate-500">Hệ thống tạo booking hàng loạt</p>
                        </div>
                    </div>
                </Card>
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200 shadow-sm rounded-2xl overflow-hidden group">
                    <div className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <span className="font-bold">3</span>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">Tự động gia hạn</p>
                            <p className="text-xs text-slate-500">Hệ thống tự quét & sinh lịch khi Admin truy cập đầu mỗi tháng.</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Tìm theo tên khách, SĐT hoặc mã sân..." 
                    className="pl-10 h-11 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto space-y-4 thin-scrollbar pr-1">
                {(configsLoading || bookingsLoading) ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="rounded-2xl border-slate-200">
                            <CardHeader className="p-6">
                                <div className="flex gap-4">
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-5 w-1/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))
                ) : filteredConfigs.length > 0 ? (
                    filteredConfigs.map((config) => (
                        <ConfigCard 
                            key={config.id} 
                            config={config} 
                            allBookings={bookings || []} 
                            courtName={courts?.find(c => c.id === config.court_id)?.name || 'N/A'}
                            onEdit={() => { setSelectedConfig(config); setDialogOpen(true); }}
                            onDelete={() => { setConfigToDelete(config); setDeleteAlertOpen(true); }}
                            onGenerate={handleManualGenerate}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300">
                        <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
                            <CalendarDays className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Chưa tìm thấy lịch nào</h3>
                        <p className="text-slate-500 mt-2 max-w-[320px] text-center">
                            Hãy thiết lập các khung giờ cố định để bắt đầu quản lý hợp đồng một cách chuyên nghiệp.
                        </p>
                        <Button className="mt-8 rounded-xl px-6" onClick={() => setDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Tạo cấu hình đầu tiên
                        </Button>
                    </div>
                )}
            </div>

            {/* Config Form Dialog */}
            {dialogOpen && (
                <FixedBookingFormDialog
                    isOpen={dialogOpen}
                    setIsOpen={setDialogOpen}
                    config={selectedConfig}
                    clubId={selectedClubId}
                    clubPricing={currentClub?.pricing}
                    courts={courts || []}
                    onSuccess={() => { refetchConfigs(); setDialogOpen(false); }}
                />
            )}

            {/* Delete Alert */}
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa cấu hình lịch cố định này? Booking đã được tạo trong lịch sẽ không bị ảnh hưởng.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl">Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function ConfigCard({ config, allBookings, courtName, onEdit, onDelete, onGenerate }: {
    config: FixedMonthlyConfig;
    allBookings: UserBooking[];
    courtName: string;
    onEdit: () => void;
    onDelete: () => void;
    onGenerate: (month: string) => Promise<void>;
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    
    const currentMonth = format(new Date(), 'yyyy-MM');
    const nextMonth = format(addMonths(new Date(), 1), 'yyyy-MM');
    
    const getMonthLabel = (m: string) => {
        try {
            const date = parse(m, 'yyyy-MM', new Date());
            return format(date, 'MM-yyyy');
        } catch (e) { return m; }
    };

    const getDayLabel = (day: number) => DAYS_OF_WEEK.find(d => d.value === day)?.label || 'N/A';

    return (
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white hover:shadow-md transition-all">
            <CardHeader className="p-4 md:p-6 pb-2 border-b border-slate-50">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                            <span className="font-bold text-lg">{config.customer_name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-slate-800">{config.customer_name}</h3>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500 font-medium">{config.customer_phone}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono text-[10px] py-0 px-2">
                                    {getDayLabel(config.day_of_week)} {config.start_time}-{config.end_time}
                                </Badge>
                                <span className="text-[11px] text-slate-400">Sân: {courtName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                             <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tình trạng</p>
                                <p className="text-xs font-semibold text-primary">{config.is_auto_renew ? 'Tự động gia hạn' : 'Lịch định kỳ'}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsExpanded(!isExpanded)}>
                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </Button>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={onEdit}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-destructive" onClick={onDelete}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            
            {isExpanded && (
                <CardContent className="p-0 bg-slate-50/30">
                    <div className="divide-y divide-slate-100">
                        <MonthSection 
                            month={nextMonth} 
                            monthLabel={`Tháng ${getMonthLabel(nextMonth)}`}
                            config={config} 
                            bookings={allBookings.filter(b => b.booking_group_id === `FIXED-${config.id}-${nextMonth}`)} 
                            onGenerate={() => onGenerate(nextMonth)}
                            isNext
                        />
                        <MonthSection 
                            month={currentMonth} 
                            monthLabel={`Tháng ${getMonthLabel(currentMonth)}`}
                            config={config} 
                            bookings={allBookings.filter(b => b.booking_group_id === `FIXED-${config.id}-${currentMonth}`)} 
                            onGenerate={() => onGenerate(currentMonth)}
                        />
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

function MonthSection({ month, monthLabel, config, bookings, onGenerate, isNext }: {
    month: string;
    monthLabel: string;
    config: FixedMonthlyConfig;
    bookings: UserBooking[];
    onGenerate: () => Promise<void>;
    isNext?: boolean;
}) {
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await onGenerate();
        } finally {
            setGenerating(false);
        }
    };

    const hasBookings = bookings.length > 0;
    const totalPrice = bookings.reduce((sum, b) => sum + b.total_price, 0);

    return (
        <div className="p-4 bg-white/50">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm",
                        hasBookings ? "bg-slate-100 text-slate-600" : "bg-emerald-500 text-white"
                    )}>
                        {monthLabel}
                    </div>
                    
                    {hasBookings ? (
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-slate-400">Slots: <strong className="text-slate-700">{bookings.length}</strong></span>
                            <span className="text-slate-400">Tổng: <strong className="text-primary">{new Intl.NumberFormat('vi-VN').format(totalPrice)}đ</strong></span>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">Chưa tạo lịch cho tháng này</p>
                    )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                    {!hasBookings ? (
                        <Button 
                            size="sm" 
                            variant="default" 
                            className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 text-xs font-bold shadow-sm"
                            onClick={handleGenerate}
                            disabled={generating}
                        >
                            {generating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <PlayCircle className="h-3 w-3 mr-2" />}
                            Tạo Ngay
                        </Button>
                    ) : (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-primary hover:bg-primary/5 text-xs font-semibold"
                            onClick={() => setIsDetailOpen(!isDetailOpen)}
                        >
                            {isDetailOpen ? 'Ẩn bớt' : 'Chi tiết'}
                            {isDetailOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </div>

            {isDetailOpen && hasBookings && (
                <div className="mt-4 space-y-1 pl-2 border-l-2 border-slate-100 ml-6">
                    {bookings.sort((a,b) => a.date.localeCompare(b.date)).map((b, idx) => (
                        <div key={b.id} className="flex items-center justify-between py-1.5 px-3 hover:bg-slate-100/50 rounded-lg group transition-colors">
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    b.status === 'Đã xác nhận' ? 'bg-emerald-400' : 'bg-slate-300'
                                )} />
                                <span className="text-[12px] font-medium text-slate-600">
                                    {format(parse(b.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')}
                                    <span className="text-slate-400 ml-1 text-[11px]">({DAYS_OF_WEEK.find(d => d.value === (parse(b.date, 'yyyy-MM-dd', new Date()).getDay()))?.label})</span>
                                </span>
                                <span className="text-[11px] font-mono bg-slate-100 px-2 rounded text-slate-500">
                                    {b.slots[0].time} - {addMinutesToTime(b.slots[b.slots.length-1].time, 30)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] h-5 bg-white border-slate-200 text-slate-500 font-normal">
                                    {b.slots[0].court_name || 'Sân'}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function FixedBookingFormDialog({ isOpen, setIsOpen, config, clubId, clubPricing, courts, onSuccess }: {
    isOpen: boolean;
    setIsOpen: (o: boolean) => void;
    config?: FixedMonthlyConfig;
    clubId: string;
    clubPricing?: Club['pricing'];
    courts: Court[];
    onSuccess: () => void;
}) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const isEdit = !!config;

    const form = useForm<FixedMonthlyConfigSchema>({
        resolver: zodResolver(fixedMonthlyConfigSchema),
        defaultValues: {
            club_id: clubId,
            court_id: config?.court_id ?? (courts[0]?.id || ''),
            day_of_week: config?.day_of_week ?? 1,
            start_time: config?.start_time ?? '20:00',
            end_time: config?.end_time ?? '22:00',
            customer_name: config?.customer_name ?? '',
            customer_phone: config?.customer_phone ?? '',
            total_price: config?.total_price ?? 0,
            is_active: config?.is_active ?? true,
            is_auto_renew: config?.is_auto_renew ?? true,
            note: config?.note ?? '',
            start_month: config?.start_month ?? format(new Date(), 'yyyy-MM'),
        },
    });

    const watchedDay = form.watch('day_of_week');
    const watchedStart = form.watch('start_time');
    const watchedEnd = form.watch('end_time');

    useEffect(() => {
        if (!isEdit && clubPricing && watchedStart && watchedEnd) {
            const calculated = calculateRangePrice(watchedStart, watchedEnd, watchedDay, clubPricing);
            if (calculated > 0) {
                form.setValue('total_price', calculated, { shouldValidate: true });
            }
        }
    }, [watchedDay, watchedStart, watchedEnd, clubPricing, isEdit]);

    const refreshPrice = () => {
        if (clubPricing && watchedStart && watchedEnd) {
            const calculated = calculateRangePrice(watchedStart, watchedEnd, watchedDay, clubPricing);
            form.setValue('total_price', calculated, { shouldValidate: true });
            toast({ title: 'Đã cập nhật đơn giá', description: `Giá mỗi buổi: ${formatVND(calculated)}` });
        }
    };

    const watchedTotalPrice = form.watch('total_price');
    const estimatedMonthly = watchedTotalPrice * 4.345; // Average weeks per month

    const onSubmit = async (values: FixedMonthlyConfigSchema) => {
        try {
            if (isEdit && config) {
                const { error } = await supabase.from('fixed_monthly_configs').update(values).eq('id', config.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('fixed_monthly_configs').insert(values);
                if (error) throw error;
            }
            toast({ title: 'Thành công', description: `Đã ${isEdit ? 'cập nhật' : 'tạo'} lịch cố định.` });
            onSuccess();
        } catch (error: any) {
            toast({ title: 'Lỗi', description: error.message || 'Không thể lưu cấu hình.', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[650px] rounded-2xl p-0 overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {isEdit ? <Pencil className="h-5 w-5 text-primary" /> : <PlusCircle className="h-5 w-5 text-primary" />}
                        {isEdit ? 'Chỉnh sửa cấu hình khách quen' : 'Thêm cấu hình hợp đồng mới'}
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">Hệ thống sẽ tạo lịch tự động dựa trên các thông số này.</p>
                </div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                        {/* Thông tin khách hàng */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Thông tin khách hàng</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="customer_name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700">Tên khách / Nhóm</FormLabel>
                                        <FormControl><Input {...field} placeholder="VD: Anh Toàn Final" className="rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="customer_phone" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700">Số điện thoại</FormLabel>
                                        <FormControl><Input {...field} placeholder="09xxxxxxxxx" className="rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        {/* Chi tiết đặt sân */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Chi tiết lịch định kỳ</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="day_of_week" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700">Thứ trong tuần</FormLabel>
                                        <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value.toString()}>
                                            <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent className="rounded-xl">
                                                {DAYS_OF_WEEK.map(d => <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="court_id" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700">Chọn sân</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Chọn sân" /></SelectTrigger></FormControl>
                                            <SelectContent className="rounded-xl">
                                                {courts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="start_month" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700">Tháng bắt đầu</FormLabel>
                                        <FormControl><Input type="month" {...field} className="rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="start_time" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700">Giờ bắt đầu</FormLabel>
                                        <FormControl><Input {...field} placeholder="20:00" className="rounded-xl font-mono" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="end_time" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700">Giờ kết thúc</FormLabel>
                                        <FormControl><Input {...field} placeholder="22:00" className="rounded-xl font-mono" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="total_price" render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between items-end">
                                            <FormLabel className="text-slate-700">Giá mỗi buổi (Đơn giá)</FormLabel>
                                            <Button type="button" variant="ghost" className="h-6 px-2 text-[10px] text-primary hover:text-primary/80" onClick={refreshPrice}>Tự động tính</Button>
                                        </div>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="number" {...field} className="rounded-xl pr-16" />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">đ</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                        <div className="flex items-center justify-between mt-1.5 px-1">
                                            <p className="text-[10px] text-slate-400 italic">* Tự động lấy giá theo khung giờ CLB</p>
                                            <p className="text-[10px] text-primary font-bold">~ {formatVND(watchedTotalPrice * 4)}/tháng (4 tuần)</p>
                                        </div>
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        {/* Cài đặt vận hành */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cài đặt vận hành</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="is_active" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 p-4 bg-white">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-sm font-bold">Hoạt động</FormLabel>
                                            <p className="text-[11px] text-slate-500">Tạm dừng nếu khách nghỉ dài hạn</p>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="is_auto_renew" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 p-4 bg-white">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-sm font-bold">Tự động gia hạn</FormLabel>
                                            <p className="text-[11px] text-slate-500">Tự động tạo lịch vào đầu mỗi tháng</p>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <DialogClose asChild><Button variant="ghost" className="rounded-xl">Hủy bỏ</Button></DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl px-8 shadow-md">
                                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</> : (isEdit ? 'Cập nhật cấu hình' : 'Tạo cấu hình')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
