'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addMonths, startOfMonth } from 'date-fns';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { Club, UserProfile, Court, FixedMonthlyConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, Pencil, CalendarDays, Loader2, PlayCircle, Info, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { fixedMonthlyConfigSchema, type FixedMonthlyConfigSchema } from './schemas';

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
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [targetMonth, setTargetMonth] = useState(format(new Date(), 'yyyy-MM'));

    const { data: allClubs, loading: clubsLoading } = useSupabaseQuery<Club>('clubs');

    const clubs = useMemo(() => {
        if (!allClubs) return [];
        if (userProfile.role === 'club_owner') {
            return allClubs.filter(c => userProfile.managed_club_ids?.includes(c.id));
        }
        return allClubs;
    }, [allClubs, userProfile]);

    useMemo(() => {
        if (clubs.length > 0 && !selectedClubId) {
            setSelectedClubId(clubs[0].id);
        }
    }, [clubs, selectedClubId]);

    const { data: configs, loading: configsLoading, refetch: refetchConfigs } = useSupabaseQuery<FixedMonthlyConfig>(
        selectedClubId ? 'fixed_monthly_configs' : null,
        (q) => q.eq('club_id', selectedClubId),
        { deps: [selectedClubId] }
    );

    const { data: courts } = useSupabaseQuery<Court>(
        selectedClubId ? 'courts' : null,
        (q) => q.eq('club_id', selectedClubId),
        { deps: [selectedClubId] }
    );

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

    const handleGenerate = async () => {
        if (!selectedClubId) return;
        setGenerating(true);
        try {
            const { data, error } = await supabase.rpc('generate_monthly_bookings', {
                p_club_id: selectedClubId,
                p_year_month: targetMonth
            });

            if (error) throw error;

            const result = data[0] || data; // Handle different return formats
            toast({
                title: 'Hoàn tất tạo lịch',
                description: `Đã tạo ${result.total_created} lịch mới. Bỏ qua ${result.total_skipped} lịch do trùng.`,
            });
            setGenerateDialogOpen(false);
        } catch (error: any) {
            console.error(error);
            toast({ title: 'Lỗi', description: error.message || 'Không thể tạo lịch.', variant: 'destructive' });
        } finally {
            setGenerating(false);
        }
    };

    const getCourtName = (id: string) => courts?.find(c => c.id === id)?.name || 'N/A';
    const getDayLabel = (day: number) => DAYS_OF_WEEK.find(d => d.value === day)?.label || 'N/A';

    return (
        <div className="space-y-6 flex-1 flex flex-col min-h-0 overflow-hidden">
            <Card className="shrink-0">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                Đặt lịch cố định theo tháng
                            </CardTitle>
                            <CardDescription>Cấu hình các khung giờ lặp lại hàng tuần cho khách quen.</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                                <SelectTrigger className="w-[200px] bg-background">
                                    <SelectValue placeholder="Chọn câu lạc bộ" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="default" onClick={() => { setSelectedConfig(undefined); setDialogOpen(true); }}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Thêm cấu hình lịch
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[250px] p-3">
                                        <p className="text-xs">Thiết lập dữ liệu gốc (Thứ, Giờ, Sân). Dữ liệu này sẽ làm căn cứ để hệ thống tạo danh sách booking hàng loạt cho tháng.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" className="border-primary text-primary hover:bg-primary/5" onClick={() => setGenerateDialogOpen(true)}>
                                            <PlayCircle className="mr-2 h-4 w-4" /> Tạo lịch tháng
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[250px] p-3">
                                        <p className="text-xs">Dựa trên các "Cấu hình lịch" đã thiết lập, hệ thống sẽ quét toàn bộ tháng bạn chọn để tạo các đặt sân thực tế.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    {/* Hướng dẫn các bước */}
                    <div className="mt-6 bg-blue-50/50 border border-blue-100 p-4 rounded-lg flex flex-col md:flex-row gap-6 items-start md:items-center text-sm text-slate-600">
                        <div className="flex items-start gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm shadow-sm">1</div>
                            <div className="space-y-1">
                                <p className="font-semibold text-slate-800">Thêm cấu hình lịch</p>
                                <p className="text-xs">Thiết lập trước các khung giờ khách quen cố định hàng tuần (Thứ, Giờ, Sân).</p>
                            </div>
                        </div>
                        <div className="hidden md:flex h-6 w-[1px] bg-blue-200"></div>
                        <div className="flex items-start gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm shadow-sm">2</div>
                            <div className="space-y-1">
                                <p className="font-semibold text-slate-800">Tạo lịch tháng</p>
                                <p className="text-xs">Vào ngày đầu tháng, bấm <strong>Tạo lịch tháng</strong> để hệ thống tự động sinh booking thực tế, tự động bỏ qua nếu sân đã bị đặt.</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <CardContent className="flex-1 overflow-auto p-0 thin-scrollbar">
                    {configsLoading ? (
                        <div className="p-8 space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : configs && configs.length > 0 ? (
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="w-[120px]">Thứ</TableHead>
                                    <TableHead>Khung giờ</TableHead>
                                    <TableHead>Sân</TableHead>
                                    <TableHead>Khách hàng</TableHead>
                                    <TableHead>SĐT</TableHead>
                                    <TableHead>Đơn giá</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {configs.map((config) => (
                                    <TableRow key={config.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium text-primary">
                                            {getDayLabel(config.day_of_week)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">{config.start_time} - {config.end_time}</Badge>
                                        </TableCell>
                                        <TableCell>{getCourtName(config.court_id)}</TableCell>
                                        <TableCell className="font-semibold">{config.customer_name}</TableCell>
                                        <TableCell>{config.customer_phone}</TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('vi-VN').format(config.total_price)} đ
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={config.is_active ? "default" : "secondary"}>
                                                {config.is_active ? 'Hoạt động' : 'Tạm dừng'}
                                            </Badge>
                                            {config.is_auto_renew && (
                                                <Badge variant="outline" className="ml-1 text-[10px] bg-blue-50 text-blue-600 border-blue-200">
                                                    Tự động gia hạn
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedConfig(config); setDialogOpen(true); }}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setConfigToDelete(config); setDeleteAlertOpen(true); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <CalendarDays className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium">Chưa có lịch cố định</h3>
                                <p className="text-sm text-muted-foreground max-w-[400px] mx-auto">
                                    Thiết lập lịch khách cố định để hệ thống tự động tạo booking hàng tháng giúp bạn tiết kiệm thời gian.
                                </p>
                            </div>
                            <Button onClick={() => setDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Thêm lịch đầu tiên
                            </Button>
                        </div>
                    )}
                </CardContent>
                {configs && configs.length > 0 && (
                    <CardFooter className="py-3 px-6 bg-muted/20 border-t border-muted text-[11px] text-muted-foreground italic flex items-center gap-2">
                        <Info className="h-3 w-3" />
                        Gợi ý: Bạn có thể chỉnh sửa lịch bất cứ lúc nào trước khi bấm "Tạo lịch tháng".
                    </CardFooter>
                )}
            </Card>

            {/* Config Form Dialog */}
            {dialogOpen && (
                <FixedBookingFormDialog
                    isOpen={dialogOpen}
                    setIsOpen={setDialogOpen}
                    config={selectedConfig}
                    clubId={selectedClubId}
                    courts={courts || []}
                    onSuccess={() => { refetchConfigs(); setDialogOpen(false); }}
                />
            )}

            {/* Generate Dialog */}
            <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Tạo lịch hàng loạt</DialogTitle>
                        <CardDescription>
                            Tạo tất cả các booking cho các khách cố định trong một tháng cụ thể.
                        </CardDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Chọn tháng áp dụng</Label>
                            <Input
                                type="month"
                                value={targetMonth}
                                onChange={(e) => setTargetMonth(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-700 leading-relaxed">
                            <strong>Lưu ý:</strong> Hệ thống sẽ tự động tìm kiếm các ngày phù hợp trong tháng và đối chiếu với cấu hình đã lưu. Nếu khung giờ đã có người đặt, hệ thống sẽ tự động bỏ qua để tránh trùng lịch.
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Hủy</Button></DialogClose>
                        <Button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...</> : 'Bắt đầu tạo lịch'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa cấu hình lịch cố định này? Booking đã được tạo trong lịch sẽ không bị ảnh hưởng.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function FixedBookingFormDialog({ isOpen, setIsOpen, config, clubId, courts, onSuccess }: {
    isOpen: boolean;
    setIsOpen: (o: boolean) => void;
    config?: FixedMonthlyConfig;
    clubId: string;
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
        },
    });

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
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Chỉnh sửa lịch cố định' : 'Thêm lịch cố định mới'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="day_of_week" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Thứ trong tuần</FormLabel>
                                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value.toString()}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {DAYS_OF_WEEK.map(d => <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="court_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sân tương ứng</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Chọn sân" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {courts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="start_time" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Giờ bắt đầu</FormLabel>
                                    <FormControl><Input {...field} placeholder="hh:mm" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="end_time" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Giờ kết thúc</FormLabel>
                                    <FormControl><Input {...field} placeholder="hh:mm" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="customer_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên khách hàng</FormLabel>
                                    <FormControl><Input {...field} placeholder="Nguyễn Văn A" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="customer_phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số điện thoại</FormLabel>
                                    <FormControl><Input {...field} placeholder="09xxxxxxxx" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="total_price" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tổng tiền (cho mỗi buổi)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <FormField control={form.control} name="is_active" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5"><FormLabel>Kích hoạt</FormLabel></div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="is_auto_renew" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5"><FormLabel>Tự động gia hạn</FormLabel></div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <DialogFooter className="pt-4">
                            <DialogClose asChild><Button variant="ghost">Hủy</Button></DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm cấu hình')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
