'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { DatePicker, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { AntdRegistry } from '@ant-design/nextjs-registry';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { GripVertical } from 'lucide-react';

dayjs.locale('vi');

import { useSupabase, useUser, useSupabaseQuery, useSupabaseRow } from '@/supabase';
import type { UserBooking, Club, Court, UserProfile, NewsArticle, NewsTag, ClubType } from '@/lib/types';
import { timeSlots } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription as FormDescriptionComponent, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal, PlusCircle, Trash2, Pencil, UploadCloud, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Calendar as CalendarIcon, BarChart as BarChartIcon, LayoutDashboard, CalendarDays, Building, Newspaper, Tags, Users, Shapes, LogOut, Feather, Search, CalendarClock, FileText, Bell, CheckCircle2, Clock, Lock, Unlock, Key, FileDown, Settings2
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarTrigger,
    SidebarInset,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDay } from 'date-fns';


// Schemas
const loginSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ.' }),
    password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' }),
    rememberMe: z.boolean().default(false),
});
type LoginSchema = z.infer<typeof loginSchema>;


const clubOwnerSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ.' }),
    password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' }),
    managedClubIds: z.array(z.string()).optional(),
});
type ClubOwnerSchema = z.infer<typeof clubOwnerSchema>;


const clubOwnerEditSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ.' }),
    managedClubIds: z.array(z.string()).optional(),
});
type ClubOwnerEditSchema = z.infer<typeof clubOwnerEditSchema>;


const staffSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ.' }),
    password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' }),
    managedClubIds: z.array(z.string()).optional(),
});
type StaffSchema = z.infer<typeof staffSchema>;


const staffEditSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ.' }),
    managedClubIds: z.array(z.string()).optional(),
});
type StaffEditSchema = z.infer<typeof staffEditSchema>;


const priceTierSchema = z.object({
    timeRange: z.tuple([
        z.string().regex(/^(([0-1]?[0-9]|2[0-3]):[0-5][0-9]|24:00)$/, 'Sai định dạng giờ (HH:mm)'),
        z.string().regex(/^(([0-1]?[0-9]|2[0-3]):[0-5][0-9]|24:00)$/, 'Sai định dạng giờ (HH:mm)')
    ]),
    price: z.coerce.number().min(0, 'Giá phải lớn hơn 0'),
});

const clubSchema = z.object({
    name: z.string().min(1, 'Tên không được để trống'),
    address: z.string().min(1, 'Địa chỉ không được để trống'),
    phone: z.string().min(1, 'Số điện thoại không được để trống'),
    clubType: z.string().min(1, 'Vui lòng chọn loại câu lạc bộ'),
    rating: z.coerce.number().min(0, 'Rating phải từ 0-5').max(5, 'Rating phải từ 0-5').optional(),
    imageUrls: z.array(z.string().url()).optional(),
    pricing: z.object({
        weekday: z.array(priceTierSchema),
        weekend: z.array(priceTierSchema),
    }),
    operatingHours: z.string().optional(),
    servicesHtml: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    isActive: z.boolean().default(true),
    paymentQrUrl: z.string().optional(),
    priceListHtml: z.string().optional(),
    priceListImageUrl: z.string().optional(),
    mapVideoUrl: z.string().optional(),
});
type ClubSchema = z.infer<typeof clubSchema>;


const courtFormSchema = z.object({
    name: z.string().min(1, 'Tên sân không được để trống'),
    description: z.string().optional(),
    order: z.coerce.number().optional(),
});
type CourtFormSchema = z.infer<typeof courtFormSchema>;


const newsFormSchema = z.object({
    title: z.string().min(1, 'Tiêu đề không được để trống'),
    shortDescription: z.string().min(1, 'Mô tả ngắn không được để trống'),
    contentHtml: z.string().min(1, 'Nội dung không được để trống'),
    tags: z.array(z.string()).optional(),
});
type NewsFormSchema = z.infer<typeof newsFormSchema>;


const newTagSchema = z.object({
    name: z.string().min(1, 'Tên tag không được để trống').refine(s => !s.includes('/'), { message: 'Tên tag không được chứa ký tự "/"' }),
});
type NewTagSchema = z.infer<typeof newTagSchema>;


const clubTypeSchema = z.object({
    name: z.string().min(1, 'Tên loại không được để trống'),
    order: z.coerce.number().default(0),
});
type ClubTypeSchema = z.infer<typeof clubTypeSchema>;


// Main Components
function AdminLoginPage() {
    const supabase = useSupabase();
    const [loginError, setLoginError] = useState('');

    const form = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '', rememberMe: false },
    });

    const onSubmit = async (values: LoginSchema) => {
        setLoginError('');
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });
            if (error) {
                if (error.message?.includes('Invalid login credentials')) {
                    setLoginError('Email hoặc mật khẩu không chính xác.');
                } else {
                    setLoginError('Đã xảy ra lỗi. Vui lòng thử lại.');
                }
            }
        } catch (error: any) {
            console.error(error);
            setLoginError('Đã xảy ra lỗi. Vui lòng thử lại.');
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Đăng nhập Admin</CardTitle>
                    <CardDescription>Nhập email và mật khẩu của bạn để tiếp tục.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem> <FormLabel>Email</FormLabel> <FormControl><Input placeholder="admin@example.com" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField control={form.control} name="password" render={({ field }) => (<FormItem> <FormLabel>Mật khẩu</FormLabel> <FormControl><Input type="password" {...field} /></FormControl> <FormMessage /> </FormItem>)} />

                            <FormField
                                control={form.control}
                                name="rememberMe"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                id="rememberMe"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="grid gap-1.5 leading-none">
                                            <Label
                                                htmlFor="rememberMe"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                Ghi nhớ đăng nhập
                                            </Label>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {loginError && <p className="text-sm font-medium text-destructive">{loginError}</p>}
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}> {form.formState.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'} </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

function NotificationCenter({ userProfile }: { userProfile: UserProfile }) {
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
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 5);
    }, [allBookings, userProfile]);

    useEffect(() => {
        if (!relevantNotifications.length) return;

        const unread = relevantNotifications.filter(n => {
            const time = new Date(n.created_at || 0).getTime();
            return time > lastSeenTime && n.status === 'Chờ xác nhận';
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
                                        new Date(noti.created_at || 0).getTime() > lastSeenTime && noti.status === 'Chờ xác nhận' ? "bg-primary/10" : ""
                                    )}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold leading-none">{noti.name}</p>
                                            <p className="text-xs text-muted-foreground">{noti.club_name}</p>
                                        </div>
                                        {noti.status === 'Chờ xác nhận' ? (
                                            <Clock className="h-3 w-3 text-yellow-500" />
                                        ) : (
                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
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

function AdminDashboard({ userProfile }: { userProfile: UserProfile }) {
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

// Price calculation utility for Schedule
function getPriceForSlot(time: string, date: Date, pricing?: Club['pricing']): number {
    if (!pricing) return 0;
    const dayOfWeek = getDay(date);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const relevantTiers = isWeekend ? pricing.weekend : pricing.weekday;

    if (!relevantTiers) return 0;

    const [h, m] = time.split(':').map(Number);
    const slotValue = h * 60 + m;

    for (const tier of relevantTiers) {
        if (!tier.timeRange || tier.timeRange.length < 2) continue;

        const [sh, sm] = tier.timeRange[0].split(':').map(Number);
        const startValue = sh * 60 + sm;

        const [eh, em] = tier.timeRange[1].split(':').map(Number);
        let endValue = eh * 60 + em;

        if (eh === 24 || (eh === 0 && endValue <= startValue)) {
            endValue = 1440;
        }

        if (slotValue >= startValue && slotValue < endValue) {
            return tier.price;
        }
    }
    return 0;
}

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

function ScheduleManager({ userProfile }: { userProfile: UserProfile }) {
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

// Booking Management
function BookingManager({ userProfile, highlightedBookingId, onHighlightCleared }: { userProfile: UserProfile, highlightedBookingId?: string | null, onHighlightCleared?: () => void }) {
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

            // Build slot rows grouped by date
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

// Court Management
function CourtManager({ club, userRole }: { club: Club, userRole: UserProfile['role'] }) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const { data: courts, loading, refetch } = useSupabaseQuery<Court>('courts', (q) => q.eq('club_id', club.id), { deps: [club.id] });
    const sortedCourts = useMemo(() => courts?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [courts]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCourt, setSelectedCourt] = useState<Court | undefined>(undefined);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [courtToDelete, setCourtToDelete] = useState<Court | null>(null);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = sortedCourts!.findIndex((item) => item.id === active.id);
            const newIndex = sortedCourts!.findIndex((item) => item.id === over.id);
            const newSorted = arrayMove(sortedCourts!, oldIndex, newIndex);
            for (let i = 0; i < newSorted.length; i++) {
                await supabase.from('courts').update({ order: i }).eq('id', newSorted[i].id);
            }
            toast({ title: 'Đã cập nhật thứ tự', description: 'Thứ tự các sân đã được lưu.' });
            refetch();
        }
    };

    const confirmDelete = async () => {
        if (!courtToDelete) return;
        const { error } = await supabase.from('courts').delete().eq('id', courtToDelete.id);
        if (error) { toast({ title: 'Lỗi', description: 'Không thể xóa sân.', variant: 'destructive' }); }
        else { toast({ title: 'Thành công', description: 'Đã xóa sân.' }); refetch(); }
        setDeleteAlertOpen(false); setCourtToDelete(null);
    };

    return (
        <Card>
            <CardHeader><div className="flex justify-between items-center"><CardTitle>Sân</CardTitle><Button variant="outline" size="sm" onClick={() => { setSelectedCourt(undefined); setDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Thêm sân</Button></div></CardHeader>
            <CardContent>
                {loading && <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                    <SortableContext items={sortedCourts?.map(c => c.id) || []} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">{sortedCourts?.map(court => (<SortableCourtItem key={court.id} court={court} onEdit={(c) => { setSelectedCourt(c); setDialogOpen(true); }} onDelete={(c) => { setCourtToDelete(c); setDeleteAlertOpen(true); }} />))}</div>
                    </SortableContext>
                </DndContext>
                {!loading && sortedCourts?.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Chưa có sân nào.</p>}
            </CardContent>
            {dialogOpen && <CourtFormDialog key={selectedCourt?.id || 'new'} isOpen={dialogOpen} setIsOpen={setDialogOpen} clubId={club.id} court={selectedCourt} userRole={userRole} onSuccess={refetch} />}
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể được hoàn tác.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </Card>
    );
}

function SortableCourtItem({ court, onEdit, onDelete }: { court: Court; onEdit: (court: Court) => void; onDelete: (court: Court) => void; }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: court.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' as any, opacity: isDragging ? 0.6 : 1 };
    return (
        <div ref={setNodeRef} style={style} className={cn("flex items-center justify-between p-2 rounded-md bg-card border hover:bg-muted transition-colors", isDragging && "shadow-lg border-primary")}>
            <div className="flex items-center gap-3"><div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground"><GripVertical className="h-4 w-4" /></div><span className="font-medium text-sm">{court.name}</span></div>
            <div className="flex items-center"><Button variant="ghost" size="icon" onClick={() => onEdit(court)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(court)}><Trash2 className="h-4 w-4" /></Button></div>
        </div>
    );
}

// Club Management
function ClubManager({ userProfile }: { userProfile: UserProfile }) {
    const supabase = useSupabase();
    const { data: allClubs, loading, refetch } = useSupabaseQuery<Club>('clubs');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedClub, setSelectedClub] = useState<Club | undefined>(undefined);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [clubToDelete, setClubToDelete] = useState<Club | null>(null);
    const { toast } = useToast();
    const isAdmin = userProfile.role === 'admin';

    const clubs = useMemo(() => {
        if (!allClubs) return [];
        if (userProfile.role === 'club_owner') return allClubs.filter(c => userProfile.managed_club_ids?.includes(c.id));
        return allClubs;
    }, [allClubs, userProfile]);

    const handleToggleActive = async (club: Club) => {
        if (!isAdmin) return;
        const newIsActive = !(club.is_active ?? true);
        const { error } = await supabase.from('clubs').update({ is_active: newIsActive }).eq('id', club.id);
        if (error) { toast({ title: 'Lỗi', description: 'Không thể cập nhật trạng thái.', variant: 'destructive' }); }
        else { toast({ title: 'Cập nhật thành công', description: `Câu lạc bộ "${club.name}" đã được ${newIsActive ? 'hiển thị' : 'ẩn'}.` }); refetch(); }
    };

    const confirmDelete = async () => {
        if (!clubToDelete || !isAdmin) return;
        const { error } = await supabase.from('clubs').delete().eq('id', clubToDelete.id);
        if (error) { toast({ title: 'Lỗi', description: 'Không thể xóa câu lạc bộ.', variant: 'destructive' }); }
        else { toast({ title: 'Thành công', description: 'Đã xóa câu lạc bộ.' }); refetch(); }
        setDeleteAlertOpen(false); setClubToDelete(null);
    };

    return (
        <Card>
            <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Danh sách Câu lạc bộ</CardTitle><CardDescription>Thêm, sửa, hoặc xóa câu lạc bộ và quản lý sân/giá.</CardDescription></div>
                {isAdmin && (<Button onClick={() => { setSelectedClub(undefined); setDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Thêm Câu lạc bộ</Button>)}
            </div></CardHeader>
            <CardContent>
                {loading && <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
                {!loading && clubs && clubs.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {clubs.map(club => (
                            <AccordionItem key={club.id} value={club.id}>
                                <div className="flex items-center">
                                    <AccordionTrigger className="flex-grow">{club.name} <Badge variant="secondary" className="ml-2">{club.club_type}</Badge></AccordionTrigger>
                                    <div className="flex items-center space-x-2 pr-4">
                                        <Switch checked={club.is_active ?? true} onCheckedChange={() => handleToggleActive(club)} onClick={(e) => e.stopPropagation()} disabled={!isAdmin} />
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedClub(club); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                        {isAdmin && <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setClubToDelete(club); setDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>}
                                    </div>
                                </div>
                                <AccordionContent><div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2"><CourtManager club={club} userRole={userProfile.role} /><PricingManager club={club} /></div></AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (!loading && <p className="text-center text-muted-foreground py-8">Chưa có câu lạc bộ nào.</p>)}
            </CardContent>
            {dialogOpen && <ClubFormDialog key={selectedClub?.id || 'new'} isOpen={dialogOpen} setIsOpen={setDialogOpen} club={selectedClub} userRole={userProfile.role} onSuccess={refetch} />}
            {isAdmin && (<AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle><AlertDialogDescription>Thao tác này sẽ xóa vĩnh viễn câu lạc bộ.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
        </Card>
    );
}

function PricingManager({ club }: { club: Club }) {
    const { pricing } = club;
    return (
        <Card>
            <CardHeader><CardTitle>Thông tin giá</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div><h4 className="font-semibold mb-2">Ngày thường</h4><Table><TableHeader><TableRow><TableHead>Khung thời gian</TableHead><TableHead className="text-right">Đơn giá/30 phút</TableHead></TableRow></TableHeader><TableBody>{pricing?.weekday.map((tier, i) => (<TableRow key={i}><TableCell>{tier.timeRange.join(' - ')}</TableCell><TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(tier.price)} VND</TableCell></TableRow>))}</TableBody></Table></div>
                <div><h4 className="font-semibold mb-2">Cuối tuần</h4><Table><TableHeader><TableRow><TableHead>Khung thời gian</TableHead><TableHead className="text-right">Đơn giá/30 phút</TableHead></TableRow></TableHeader><TableBody>{pricing?.weekend.map((tier, i) => (<TableRow key={i}><TableCell>{tier.timeRange.join(' - ')}</TableCell><TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(tier.price)} VND</TableCell></TableRow>))}</TableBody></Table></div>
            </CardContent>
        </Card>
    );
}

function CourtFormDialog({ isOpen, setIsOpen, clubId, court, userRole, onSuccess }: { isOpen: boolean; setIsOpen: (open: boolean) => void; clubId: string; court?: Court, userRole: UserProfile['role'], onSuccess?: () => void }) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const isEditMode = !!court;
    const [imageUrls, setImageUrls] = useState<string[]>(court?.image_urls || []);
    const [uploadingFiles, setUploadingFiles] = useState<{ name: string }[]>([]);
    const form = useForm<CourtFormSchema>({ resolver: zodResolver(courtFormSchema), defaultValues: isEditMode ? { name: court.name, description: court.description || '', order: court.order || 0 } : { name: '', description: '', order: 0 } });

    useEffect(() => { if (isEditMode && court) { form.reset({ name: court.name, description: court.description || '', order: court.order || 0 }); setImageUrls(court.image_urls || []); } else { form.reset({ name: '', description: '', order: 0 }); setImageUrls([]); } }, [isOpen, isEditMode, court, form]);

    const handleImageUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        if (imageUrls.length + files.length > 2) { toast({ title: "Lỗi", description: "Tối đa 2 ảnh.", variant: "destructive" }); return; }
        const currentUploading = Array.from(files).map(file => ({ name: file.name }));
        setUploadingFiles(prev => [...prev, ...currentUploading]);
        const cloudName = 'dxmx9b1zi'; const uploadPreset = 'toan_badminton';
        Array.from(files).forEach(file => {
            const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', uploadPreset);
            fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData })
                .then(r => r.json()).then(data => { if (data.secure_url) setImageUrls(prev => [...prev, data.secure_url]); else throw new Error('Upload failed'); })
                .catch(() => toast({ title: "Lỗi tải lên", variant: "destructive" }))
                .finally(() => setUploadingFiles(prev => prev.filter(f => f.name !== file.name)));
        });
    };

    const onSubmit = async (values: CourtFormSchema) => {
        const courtData = { ...values, club_id: clubId, image_urls: imageUrls, order: values.order || 0 };
        if (isEditMode && court) {
            const { error } = await supabase.from('courts').update(courtData).eq('id', court.id);
            if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
        } else {
            const { error } = await supabase.from('courts').insert(courtData);
            if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
        }
        toast({ title: 'Thành công', description: `Đã ${isEditMode ? 'cập nhật' : 'tạo'} sân.` }); setIsOpen(false); onSuccess?.();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent className="sm:max-w-[600px]"><DialogHeader><DialogTitle>{isEditMode ? 'Chỉnh sửa Sân' : 'Tạo Sân mới'}</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tên sân</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="order" render={({ field }) => (<FormItem><FormLabel>Thứ tự</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="space-y-2"><FormLabel>Hình ảnh (Tối đa 2)</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {imageUrls.map(url => (<div key={url} className="relative group aspect-square"><Image src={url} alt="Ảnh sân" fill sizes="10vw" className="object-cover rounded-md bg-muted" /><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setImageUrls(prev => prev.filter(u => u !== url))}><Trash2 className="h-4 w-4" /></Button></div>))}
                        {imageUrls.length < 2 && (<label className="flex flex-col items-center justify-center w-full h-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary"><UploadCloud className="w-8 h-8 text-muted-foreground" /><input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} disabled={uploadingFiles.length > 0} /></label>)}
                    </div>
                    {uploadingFiles.length > 0 && <p className="text-sm text-muted-foreground">Đang tải lên...</p>}
                </div>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || uploadingFiles.length > 0}>{form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu Sân'}</Button>
            </form></Form>
        </DialogContent></Dialog>
    );
}

function ClubFormDialog({ isOpen, setIsOpen, club, userRole, onSuccess }: { isOpen: boolean; setIsOpen: (open: boolean) => void; club?: Club, userRole: UserProfile['role'], onSuccess?: () => void }) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const isEditMode = !!club;
    const canEdit = userRole === 'admin';
    const { data: clubTypes, loading: typesLoading } = useSupabaseQuery<ClubType>('club_types');
    const [imageUrls, setImageUrls] = useState<string[]>(club?.image_urls || []);
    const [uploadingFiles, setUploadingFiles] = useState<{ name: string }[]>([]);
    const [paymentQrUrl, setPaymentQrUrl] = useState<string>(club?.payment_qr_url || '');
    const [uploadingQr, setUploadingQr] = useState(false);
    const [priceListImageUrl, setPriceListImageUrl] = useState<string>(club?.price_list_image_url || '');
    const [uploadingPriceListImage, setUploadingPriceListImage] = useState(false);

    const form = useForm<ClubSchema>({
        resolver: zodResolver(clubSchema),
        defaultValues: {
            name: club?.name ?? '', address: club?.address ?? '', phone: club?.phone ?? '', clubType: club?.club_type ?? '',
            rating: club?.rating ?? undefined, pricing: club?.pricing ?? { weekday: [{ timeRange: ['05:00', '17:00'], price: 30000 }], weekend: [{ timeRange: ['05:00', '22:00'], price: 40000 }] },
            operatingHours: club?.operating_hours ?? 'Thứ 2 - CN: 05:00 - 22:00', servicesHtml: club?.services_html ?? '',
            latitude: club?.latitude ?? 0, longitude: club?.longitude ?? 0, isActive: club?.is_active ?? true,
            paymentQrUrl: club?.payment_qr_url ?? '', priceListHtml: club?.price_list_html ?? '',
            priceListImageUrl: club?.price_list_image_url ?? '', mapVideoUrl: club?.map_video_url ?? '',
        },
    });

    const { fields: weekdayFields, append: appendWeekday, remove: removeWeekday } = useFieldArray({ control: form.control, name: "pricing.weekday" });
    const { fields: weekendFields, append: appendWeekend, remove: removeWeekend } = useFieldArray({ control: form.control, name: "pricing.weekend" });

    const handleImageUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        if (imageUrls.length + files.length > 10) { toast({ title: "Lỗi", description: "Tối đa 10 ảnh.", variant: "destructive" }); return; }
        const currentUploading = Array.from(files).map(file => ({ name: file.name }));
        setUploadingFiles(prev => [...prev, ...currentUploading]);
        const cloudName = 'dxmx9b1zi'; const uploadPreset = 'toan_badminton';
        Array.from(files).forEach(file => {
            const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', uploadPreset);
            fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData })
                .then(r => r.json()).then(data => { if (data.secure_url) setImageUrls(prev => [...prev, data.secure_url]); })
                .catch(() => toast({ title: "Lỗi tải lên", variant: "destructive" }))
                .finally(() => setUploadingFiles(prev => prev.filter(f => f.name !== file.name)));
        });
    };

    const onSubmit = async (values: ClubSchema) => {
        const finalValues = {
            name: values.name, address: values.address, phone: values.phone, club_type: values.clubType,
            rating: values.rating || 0, image_urls: imageUrls, pricing: values.pricing,
            operating_hours: values.operatingHours, services_html: values.servicesHtml,
            latitude: values.latitude, longitude: values.longitude, is_active: values.isActive,
            payment_qr_url: paymentQrUrl, price_list_html: values.priceListHtml,
            price_list_image_url: priceListImageUrl, map_video_url: values.mapVideoUrl,
        };
        if (isEditMode && club) {
            const { error } = await supabase.from('clubs').update(finalValues).eq('id', club.id);
            if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
        } else {
            const { error } = await supabase.from('clubs').insert(finalValues);
            if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
        }
        toast({ title: 'Thành công', description: `Đã ${isEditMode ? 'cập nhật' : 'tạo'} câu lạc bộ.` }); setIsOpen(false); onSuccess?.();
    };

    const uploadSingleImage = (setter: (url: string) => void, setUploading: (v: boolean) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        const cloudName = 'dxmx9b1zi'; const uploadPreset = 'toan_badminton';
        const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', uploadPreset);
        fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData })
            .then(r => r.json()).then(data => data.secure_url && setter(data.secure_url))
            .catch(() => toast({ title: "Lỗi", variant: "destructive" }))
            .finally(() => setUploading(false));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent className="sm:max-w-[800px]"><DialogHeader><DialogTitle className="font-headline">{isEditMode ? 'Chỉnh sửa Câu lạc bộ' : 'Tạo Câu lạc bộ mới'}</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tên câu lạc bộ</FormLabel><FormControl><Input {...field} disabled={isEditMode && !canEdit} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Địa chỉ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="clubType" render={({ field }) => (<FormItem><FormLabel>Loại câu lạc bộ</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn loại..." /></SelectTrigger></FormControl><SelectContent>{typesLoading ? <SelectItem value="loading" disabled>Đang tải...</SelectItem> : clubTypes?.map(type => (<SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Số điện thoại</FormLabel><FormControl><Input placeholder="0912345678" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="rating" render={({ field }) => (<FormItem><FormLabel>Đánh giá (0-5)</FormLabel><FormControl><Input type="number" step="0.1" min="0" max="5" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="operatingHours" render={({ field }) => (<FormItem><FormLabel>Giờ hoạt động</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="latitude" render={({ field }) => (<FormItem><FormLabel>Vĩ độ</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="longitude" render={({ field }) => (<FormItem><FormLabel>Kinh độ</FormLabel><FormControl><Input type="number" step="any" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="isActive" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Hiển thị Câu lạc bộ</FormLabel><FormDescriptionComponent>Nếu tắt, câu lạc bộ sẽ bị ẩn.</FormDescriptionComponent></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={!canEdit} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="servicesHtml" render={({ field }) => (<FormItem><FormLabel>Dịch vụ (HTML)</FormLabel><FormControl><Textarea {...field} rows={6} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="priceListHtml" render={({ field }) => (<FormItem><FormLabel>Bảng giá chi tiết (HTML)</FormLabel><FormControl><Textarea {...field} rows={6} /></FormControl><FormMessage /></FormItem>)} />
                <div className="space-y-4 border p-4 rounded-lg bg-muted/20"><FormLabel className="text-base font-bold">Hình ảnh Bảng giá</FormLabel>
                    {priceListImageUrl ? (<div className="relative group w-full max-w-sm aspect-video border-2 border-primary/20 rounded-xl overflow-hidden shadow-md"><Image src={priceListImageUrl} alt="Price List" fill className="object-contain p-2 bg-white" /><Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => setPriceListImageUrl('')}><Trash2 className="h-4 w-4" /></Button></div>)
                    : (<label className="flex flex-col items-center justify-center w-full max-w-sm h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-secondary/50"><UploadCloud className="w-8 h-8 mb-2 text-primary/60" /><p className="text-sm font-medium">Tải lên ảnh Bảng giá</p><input type="file" className="hidden" accept="image/*" onChange={uploadSingleImage(setPriceListImageUrl, setUploadingPriceListImage)} disabled={uploadingPriceListImage} /></label>)}
                    {uploadingPriceListImage && <p className="text-xs text-primary animate-pulse">Đang tải...</p>}
                </div>
                <FormField control={form.control} name="mapVideoUrl" render={({ field }) => (<FormItem><FormLabel>Link Video Chỉ đường</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="space-y-4 border p-4 rounded-lg bg-muted/20"><FormLabel className="text-base font-bold">Mã QR Thanh toán</FormLabel>
                    {paymentQrUrl ? (<div className="relative group w-48 aspect-square border-2 border-primary/20 rounded-xl overflow-hidden shadow-md"><Image src={paymentQrUrl} alt="QR" fill className="object-contain p-2 bg-white" /><Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => setPaymentQrUrl('')}><Trash2 className="h-4 w-4" /></Button></div>)
                    : (<label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed rounded-xl cursor-pointer hover:bg-secondary/50"><UploadCloud className="w-10 h-10 mb-2 text-primary/60" /><p className="text-sm font-medium">Tải lên mã QR</p><input type="file" className="hidden" accept="image/*" onChange={uploadSingleImage(setPaymentQrUrl, setUploadingQr)} disabled={uploadingQr} /></label>)}
                    {uploadingQr && <p className="text-xs text-primary animate-pulse">Đang xử lý...</p>}
                </div>
                <div className="space-y-2"><FormLabel>Hình ảnh Câu lạc bộ (Tối đa 10)</FormLabel>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {imageUrls.map(url => (<div key={url} className="relative group aspect-square"><Image src={url} alt="Ảnh" fill sizes="10vw" className="object-cover rounded-md bg-muted" /><Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setImageUrls(prev => prev.filter(u => u !== url))}><Trash2 className="h-4 w-4" /></Button></div>))}
                        {imageUrls.length < 10 && (<label className="flex flex-col items-center justify-center w-full h-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary"><UploadCloud className="w-8 h-8 text-muted-foreground" /><input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} disabled={uploadingFiles.length > 0} /></label>)}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><h3 className="font-semibold">Giá ngày thường</h3>{weekdayFields.map((field, index) => (<div key={field.id} className="flex gap-2 items-start p-2 border rounded-md"><div className="flex-grow space-y-2"><div className="flex gap-2"><FormField control={form.control} name={`pricing.weekday.${index}.timeRange.0`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Từ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name={`pricing.weekday.${index}.timeRange.1`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Đến</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /></div><FormField control={form.control} name={`pricing.weekday.${index}.price`} render={({ field }) => (<FormItem><FormLabel>Đơn giá/30 phút</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} /></div><Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeWeekday(index)}><Trash2 className="h-4 w-4" /></Button></div>))}<Button type="button" variant="outline" size="sm" onClick={() => appendWeekday({ timeRange: ['', ''], price: 0 })}>Thêm khung giờ</Button></div>
                    <div className="space-y-2"><h3 className="font-semibold">Giá cuối tuần</h3>{weekendFields.map((field, index) => (<div key={field.id} className="flex gap-2 items-start p-2 border rounded-md"><div className="flex-grow space-y-2"><div className="flex gap-2"><FormField control={form.control} name={`pricing.weekend.${index}.timeRange.0`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Từ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name={`pricing.weekend.${index}.timeRange.1`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Đến</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /></div><FormField control={form.control} name={`pricing.weekend.${index}.price`} render={({ field }) => (<FormItem><FormLabel>Đơn giá/30 phút</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} /></div><Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeWeekend(index)}><Trash2 className="h-4 w-4" /></Button></div>))}<Button type="button" variant="outline" size="sm" onClick={() => appendWeekend({ timeRange: ['', ''], price: 0 })}>Thêm khung giờ</Button></div>
                </div>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || uploadingFiles.length > 0}>{form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
            </form></Form>
        </DialogContent></Dialog>
    );
}

// Statistics Management
function StatisticsManager({ userProfile }: { userProfile: UserProfile }) {
    const [filter, setFilter] = useState<string>('this_month');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(() => [dayjs().startOf('month'), dayjs().endOf('month')]);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all');

    const { data: allBookings, loading: bookingsLoading } = useSupabaseQuery<UserBooking>('bookings', (q) => q.eq('status', 'Đã xác nhận'));
    const { data: clubs, loading: clubsLoading } = useSupabaseQuery<Club>('clubs');
    const { data: owners, loading: ownersLoading } = useSupabaseQuery<UserProfile>(userProfile.role === 'admin' ? 'users' : null, (q) => q.eq('role', 'club_owner'));

    const loading = bookingsLoading || (userProfile.role === 'admin' && (clubsLoading || ownersLoading));

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
        if (!bookingsToProcess || !dateRange || !dateRange[0] || !dateRange[1]) return { totalRevenue: 0, totalBookings: 0, chartData: [], ownerRevenue: [] };
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
        return { totalRevenue, totalBookings, chartData, ownerRevenue };
    }, [allBookings, userProfile, dateRange, owners, clubs, selectedOwnerId]);

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
                        <BarChart data={stats.chartData}><CartesianGrid vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} /><YAxis tickFormatter={(value) => formatCurrency(value as number)} /><ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} /><Bar dataKey="Doanhthu" fill="var(--color-Doanhthu)" radius={4} /></BarChart>
                    </ChartContainer>
                </CardContent></Card>
                {userProfile.role === 'admin' && stats.ownerRevenue.length > 0 && (<Card><CardHeader><CardTitle>Doanh thu theo Chủ Club</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Chủ Club</TableHead><TableHead className="text-right">Doanh thu</TableHead></TableRow></TableHeader><TableBody>{stats.ownerRevenue.map(item => (<TableRow key={item.ownerEmail}><TableCell>{item.ownerEmail}</TableCell><TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>)}
            </CardContent>
        </Card>
    );
}

// News Management
function NewsManager() {
    const supabase = useSupabase();
    const { toast } = useToast();
    const { data: articles, loading, refetch } = useSupabaseQuery<NewsArticle>('news', (q) => q.order('created_at', { ascending: false }));
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<NewsArticle | null>(null);

    const confirmDelete = async () => {
        if (!articleToDelete) return;
        const { error } = await supabase.from('news').delete().eq('id', articleToDelete.id);
        if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); } else { toast({ title: 'Thành công', description: 'Đã xóa bài viết.' }); refetch(); }
        setDeleteAlertOpen(false); setArticleToDelete(null);
    };

    return (
        <Card>
            <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Quản lý Tin tức</CardTitle><CardDescription>Thêm, sửa, hoặc xóa các bài viết.</CardDescription></div><Button asChild><Link href="/admin/news/new"><PlusCircle className="mr-2 h-4 w-4" /> Thêm Bài viết</Link></Button></div></CardHeader>
            <CardContent>
                <Table><TableHeader><TableRow><TableHead className="hidden md:table-cell">Ảnh</TableHead><TableHead>Tiêu đề</TableHead><TableHead>Tags</TableHead><TableHead className="hidden sm:table-cell">Ngày tạo</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading && Array.from({ length: 3 }).map((_, i) => (<TableRow key={i}><TableCell className="hidden md:table-cell"><Skeleton className="h-12 w-12 rounded-md" /></TableCell><TableCell><Skeleton className="h-5 w-48" /></TableCell><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell><TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell></TableRow>))}
                        {articles?.map(article => (
                            <TableRow key={article.id}>
                                <TableCell className="hidden md:table-cell">{article.banner_image_url && <Image src={article.banner_image_url} alt={article.title} width={48} height={48} className="rounded-md object-cover aspect-square bg-muted" />}</TableCell>
                                <TableCell className="font-medium max-w-xs truncate">{article.title}</TableCell>
                                <TableCell><div className="flex flex-wrap gap-1">{article.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div></TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground">{article.created_at ? format(new Date(article.created_at), 'dd/MM/yyyy') : '...'}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/admin/news/${article.id}/edit`}>Sửa</Link></DropdownMenuItem><DropdownMenuItem onClick={() => { setArticleToDelete(article); setDeleteAlertOpen(true); }} className="text-destructive">Xóa</DropdownMenuItem></DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && articles?.length === 0 && (<TableRow><TableCell colSpan={5} className="h-24 text-center">Chưa có bài viết nào.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </CardContent>
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle><AlertDialogDescription>Bài viết sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </Card>
    );
}

// Tag Management
function TagManager() {
    const supabase = useSupabase();
    const { toast } = useToast();
    const { data: tags, loading: tagsLoading, refetch } = useSupabaseQuery<NewsTag>('news_tags');
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<NewsTag | null>(null);
    const form = useForm<NewTagSchema>({ resolver: zodResolver(newTagSchema), defaultValues: { name: '' } });

    const onSubmit = async (values: NewTagSchema) => {
        const { error } = await supabase.from('news_tags').insert(values);
        if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); } else { toast({ title: 'Thành công', description: 'Đã thêm tag mới.' }); form.reset(); refetch(); }
    };

    const confirmDelete = async () => {
        if (!tagToDelete) return;
        const { error } = await supabase.from('news_tags').delete().eq('id', tagToDelete.id);
        if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); } else { toast({ title: 'Thành công', description: `Đã xóa tag "${tagToDelete.name}".` }); refetch(); }
        setDeleteAlertOpen(false); setTagToDelete(null);
    };

    return (
        <Card>
            <CardHeader><CardTitle>Quản lý Tags Tin tức</CardTitle><CardDescription>Thêm hoặc xóa các tag phân loại bài viết.</CardDescription></CardHeader>
            <CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div><h3 className="font-semibold mb-4">Thêm Tag mới</h3><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2"><FormField control={form.control} name="name" render={({ field }) => (<FormItem className="flex-grow"><FormControl><Input placeholder="Ví dụ: Giải đấu" {...field} /></FormControl><FormMessage /></FormItem>)} /><Button type="submit" disabled={form.formState.isSubmitting}>Thêm</Button></form></Form></div>
                <div><h3 className="font-semibold mb-4">Các Tags hiện có</h3><div className="space-y-2">{tagsLoading && <Skeleton className="h-10 w-full" />}{tags?.map(tag => (<div key={tag.id} className="flex items-center justify-between p-2 bg-muted rounded-md"><span className="text-sm font-medium">{tag.name}</span><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setTagToDelete(tag); setDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button></div>))}{!tagsLoading && tags?.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Chưa có tag nào.</p>}</div></div>
            </div></CardContent>
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle><AlertDialogDescription>Tag sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </Card>
    );
}

// Club Type Management
function ClubTypeManager() {
    const supabase = useSupabase();
    const { toast } = useToast();
    const { data: clubTypes, loading: typesLoading, refetch } = useSupabaseQuery<ClubType>('club_types');
    const sortedClubTypes = useMemo(() => clubTypes?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [clubTypes]);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<ClubType | null>(null);
    const form = useForm<ClubTypeSchema>({ resolver: zodResolver(clubTypeSchema), defaultValues: { name: '', order: 0 } });

    const onSubmit = async (values: ClubTypeSchema) => {
        const { error } = await supabase.from('club_types').insert(values);
        if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); } else { toast({ title: 'Thành công', description: 'Đã thêm loại câu lạc bộ mới.' }); form.reset(); refetch(); }
    };

    const confirmDelete = async () => {
        if (!typeToDelete) return;
        const { error } = await supabase.from('club_types').delete().eq('id', typeToDelete.id);
        if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); } else { toast({ title: 'Thành công', description: `Đã xóa loại "${typeToDelete.name}".` }); refetch(); }
        setDeleteAlertOpen(false); setTypeToDelete(null);
    };

    return (
        <Card>
            <CardHeader><CardTitle>Quản lý Loại Câu lạc bộ</CardTitle><CardDescription>Thêm hoặc xóa các loại hình câu lạc bộ.</CardDescription></CardHeader>
            <CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div><h3 className="font-semibold mb-4">Thêm Loại mới</h3><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tên loại</FormLabel><FormControl><Input placeholder="Ví dụ: Cầu lông" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="order" render={({ field }) => (<FormItem><FormLabel>Thứ tự</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescriptionComponent>Dùng để sắp xếp bộ lọc.</FormDescriptionComponent><FormMessage /></FormItem>)} />
                    <Button type="submit" disabled={form.formState.isSubmitting}>Thêm</Button>
                </form></Form></div>
                <div><h3 className="font-semibold mb-4">Các Loại hiện có</h3><div className="space-y-2">{typesLoading && <Skeleton className="h-10 w-full" />}{sortedClubTypes?.map(type => (<div key={type.id} className="flex items-center justify-between p-2 bg-muted rounded-md"><span className="text-sm font-medium">{type.name} (order: {type.order || 0})</span><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setTypeToDelete(type); setDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button></div>))}{!typesLoading && sortedClubTypes?.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Chưa có loại nào.</p>}</div></div>
            </div></CardContent>
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle><AlertDialogDescription>Loại câu lạc bộ sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </Card>
    );
}

// Staff Management
function StaffManager({ userProfile }: { userProfile: UserProfile }) {
    const supabase = useSupabase();
    const isAdmin = userProfile.role === 'admin';
    const { data: allStaff, loading, refetch } = useSupabaseQuery<UserProfile>('users', (q) => q.eq('role', 'staff'));
    const { data: clubs } = useSupabaseQuery<Club>('clubs');
    const filteredStaff = useMemo(() => {
        if (!allStaff) return [];
        if (isAdmin) return allStaff;
        return allStaff.filter(staff => staff.managed_club_ids?.some(id => userProfile.managed_club_ids?.includes(id)));
    }, [allStaff, isAdmin, userProfile.managed_club_ids]);
    const filteredClubs = useMemo(() => {
        if (!clubs) return [];
        if (isAdmin) return clubs;
        return clubs.filter(c => userProfile.managed_club_ids?.includes(c.id));
    }, [clubs, isAdmin, userProfile.managed_club_ids]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<UserProfile | null>(null);
    const { toast } = useToast();

    const handleToggleLock = async (staff: UserProfile) => {
        const newLockedStatus = !(staff.is_locked ?? false);
        const { error } = await supabase.from('users').update({ is_locked: newLockedStatus }).eq('id', staff.id);
        if (error) { toast({ title: "Lỗi", variant: "destructive" }); } else { toast({ title: "Thành công", description: `Đã ${newLockedStatus ? 'khóa' : 'mở khóa'} tài khoản ${staff.email}.` }); refetch(); }
    };

    const handleSendResetEmail = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) { toast({ title: "Lỗi", description: "Không thể gửi email đặt lại mật khẩu.", variant: "destructive" }); }
        else { toast({ title: "Đã gửi email", description: `Một email đặt lại mật khẩu đã được gửi đến ${email}.` }); }
    };

    return (
        <Card>
            <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Quản lý Nhân viên</CardTitle><CardDescription>Tạo và gán quyền quản lý cơ sở cho nhân viên.</CardDescription></div><Button onClick={() => { setSelectedStaff(null); setDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Tạo Nhân viên</Button></div></CardHeader>
            <CardContent>
                <Table><TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Cơ sở quản lý</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading && <tr><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></tr>}
                        {filteredStaff?.map(staff => {
                            const managedClubs = staff.managed_club_ids?.map(id => clubs?.find(c => c.id === id)?.name).filter(Boolean);
                            const isLocked = staff.is_locked ?? false;
                            return (
                                <TableRow key={staff.id} className={cn(isLocked && "bg-muted/30 opacity-70")}>
                                    <TableCell className="font-medium"><div className="flex items-center gap-2">{staff.email}{isLocked && <Badge variant="destructive" className="text-[10px] h-4">Đã khóa</Badge>}</div></TableCell>
                                    <TableCell>{managedClubs?.join(', ') || 'Chưa gán'}</TableCell>
                                    <TableCell className="text-right"><div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedStaff(staff); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end"><DropdownMenuLabel>Tùy chọn tài khoản</DropdownMenuLabel><DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleToggleLock(staff)}>{isLocked ? <><Unlock className="mr-2 h-4 w-4" /> Mở khóa</> : <><Lock className="mr-2 h-4 w-4" /> Khóa tài khoản</>}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSendResetEmail(staff.email!)}><Key className="mr-2 h-4 w-4" /> Gửi email đặt lại mật khẩu</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div></TableCell>
                                </TableRow>
                            );
                        })}
                        {!loading && filteredStaff?.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center h-24">Chưa có nhân viên nào.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </CardContent>
            {dialogOpen && <StaffFormDialog isOpen={dialogOpen} setIsOpen={setDialogOpen} staff={selectedStaff} allClubs={filteredClubs || []} onSuccess={refetch} />}
        </Card>
    );
}

function StaffFormDialog({ isOpen, setIsOpen, staff, allClubs, onSuccess }: { isOpen: boolean, setIsOpen: (open: boolean) => void, staff: UserProfile | null, allClubs: Club[], onSuccess?: () => void }) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const isEditMode = !!staff;
    const form = useForm<StaffSchema | StaffEditSchema>({ resolver: zodResolver(isEditMode ? staffEditSchema : staffSchema), defaultValues: { email: staff?.email || '', password: '', managedClubIds: staff?.managed_club_ids || [] } });

    const onSubmit = async (values: StaffSchema | StaffEditSchema) => {
        try {
            if (isEditMode && staff) {
                const { error } = await supabase.from('users').update({ email: values.email, managed_club_ids: values.managedClubIds || [] }).eq('id', staff.id);
                if (error) throw error;
            } else {
                const response = await fetch('/api/admin/create-user', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: values.email, password: (values as StaffSchema).password, role: 'staff', managedClubIds: values.managedClubIds || [] }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Thao tác thất bại.');
            }
            toast({ title: "Thành công", description: `Đã ${isEditMode ? 'cập nhật' : 'tạo'} nhân viên.` }); setIsOpen(false); onSuccess?.();
        } catch (error: any) {
            let message = error.message || 'Thao tác thất bại.';
            if (message.includes('already been registered')) message = 'Email này đã được sử dụng.';
            toast({ title: "Lỗi", description: message, variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent><DialogHeader><DialogTitle>{isEditMode ? 'Chỉnh sửa Nhân viên' : 'Tạo Nhân viên mới'}</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="staff@example.com" {...field} disabled={isEditMode} /></FormControl><FormMessage /></FormItem>)} />
                {!isEditMode && (<FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Mật khẩu</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />)}
                <FormField control={form.control} name="managedClubIds" render={() => (<FormItem><FormLabel>Các Cơ sở quản lý</FormLabel><ScrollArea className="h-40 w-full rounded-md border p-4">{allClubs.map((club) => (<FormField key={club.id} control={form.control} name="managedClubIds" render={({ field }) => (<FormItem key={club.id} className="flex flex-row items-center space-x-3 space-y-0 mb-2"><FormControl><Checkbox checked={field.value?.includes(club.id)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), club.id]) : field.onChange(field.value?.filter((id) => id !== club.id))} /></FormControl><FormLabel className="font-normal">{club.name}</FormLabel></FormItem>)} />))}</ScrollArea><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={form.formState.isSubmitting}>Lưu thay đổi</Button>
            </form></Form>
        </DialogContent></Dialog>
    );
}

// Club Owner Management
function ClubOwnerManager() {
    const supabase = useSupabase();
    const { data: owners, loading, refetch } = useSupabaseQuery<UserProfile>('users', (q) => q.eq('role', 'club_owner'));
    const { data: clubs } = useSupabaseQuery<Club>('clubs');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState<UserProfile | null>(null);
    const { toast } = useToast();

    const handleToggleLock = async (owner: UserProfile) => {
        const newLockedStatus = !(owner.is_locked ?? false);
        const { error } = await supabase.from('users').update({ is_locked: newLockedStatus }).eq('id', owner.id);
        if (error) { toast({ title: "Lỗi", variant: "destructive" }); } else { toast({ title: "Thành công", description: `Đã ${newLockedStatus ? 'khóa' : 'mở khóa'} tài khoản ${owner.email}.` }); refetch(); }
    };

    const handleSendResetEmail = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) { toast({ title: "Lỗi", variant: "destructive" }); } else { toast({ title: "Đã gửi email", description: `Email đặt lại mật khẩu đã được gửi đến ${email}.` }); }
    };

    return (
        <Card>
            <CardHeader><div className="flex justify-between items-center"><div><CardTitle>Quản lý Chủ Câu lạc bộ</CardTitle><CardDescription>Tạo và gán câu lạc bộ cho các chủ sở hữu.</CardDescription></div><Button onClick={() => { setSelectedOwner(null); setDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Tạo Chủ Club</Button></div></CardHeader>
            <CardContent>
                <Table><TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Các Club quản lý</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading && <tr><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></tr>}
                        {owners?.map(owner => {
                            const managedClubs = owner.managed_club_ids?.map(id => clubs?.find(c => c.id === id)?.name).filter(Boolean);
                            const isLocked = owner.is_locked ?? false;
                            return (
                                <TableRow key={owner.id} className={cn(isLocked && "bg-muted/30 opacity-70")}>
                                    <TableCell className="font-medium"><div className="flex items-center gap-2">{owner.email}{isLocked && <Badge variant="destructive" className="text-[10px] h-4">Đã khóa</Badge>}</div></TableCell>
                                    <TableCell>{managedClubs?.join(', ') || 'Chưa gán'}</TableCell>
                                    <TableCell className="text-right"><div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedOwner(owner); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end"><DropdownMenuLabel>Tùy chọn tài khoản</DropdownMenuLabel><DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleToggleLock(owner)}>{isLocked ? <><Unlock className="mr-2 h-4 w-4" /> Mở khóa</> : <><Lock className="mr-2 h-4 w-4" /> Khóa tài khoản</>}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSendResetEmail(owner.email!)}><Key className="mr-2 h-4 w-4" /> Gửi email đặt lại mật khẩu</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div></TableCell>
                                </TableRow>
                            );
                        })}
                        {!loading && owners?.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center h-24">Chưa có chủ club nào.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </CardContent>
            {dialogOpen && <ClubOwnerFormDialog isOpen={dialogOpen} setIsOpen={setDialogOpen} owner={selectedOwner} allClubs={clubs || []} onSuccess={refetch} />}
        </Card>
    );
}

function ClubOwnerFormDialog({ isOpen, setIsOpen, owner, allClubs, onSuccess }: { isOpen: boolean, setIsOpen: (open: boolean) => void, owner: UserProfile | null, allClubs: Club[], onSuccess?: () => void }) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const isEditMode = !!owner;
    const form = useForm<ClubOwnerSchema | ClubOwnerEditSchema>({ resolver: zodResolver(isEditMode ? clubOwnerEditSchema : clubOwnerSchema), defaultValues: { email: owner?.email || '', password: '', managedClubIds: owner?.managed_club_ids || [] } });

    const onSubmit = async (values: ClubOwnerSchema | ClubOwnerEditSchema) => {
        try {
            if (isEditMode && owner) {
                const { error } = await supabase.from('users').update({ email: values.email, managed_club_ids: values.managedClubIds || [] }).eq('id', owner.id);
                if (error) throw error;
            } else {
                const response = await fetch('/api/admin/create-user', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: values.email, password: (values as ClubOwnerSchema).password, role: 'club_owner', managedClubIds: values.managedClubIds || [] }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Thao tác thất bại.');
            }
            toast({ title: "Thành công", description: `Đã ${isEditMode ? 'cập nhật' : 'tạo'} chủ club.` }); setIsOpen(false); onSuccess?.();
        } catch (error: any) {
            let message = error.message || 'Thao tác thất bại.';
            if (message.includes('already been registered')) message = 'Email này đã được sử dụng.';
            toast({ title: "Lỗi", description: message, variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent><DialogHeader><DialogTitle>{isEditMode ? 'Chỉnh sửa Chủ Club' : 'Tạo Chủ Club mới'}</DialogTitle></DialogHeader>
            <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="owner@example.com" {...field} disabled={isEditMode} /></FormControl><FormMessage /></FormItem>)} />
                {!isEditMode && (<FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Mật khẩu</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />)}
                <FormField control={form.control} name="managedClubIds" render={() => (<FormItem><FormLabel>Các Club quản lý</FormLabel><ScrollArea className="h-40 w-full rounded-md border p-4">{allClubs.map((club) => (<FormField key={club.id} control={form.control} name="managedClubIds" render={({ field }) => (<FormItem key={club.id} className="flex flex-row items-center space-x-3 space-y-0 mb-2"><FormControl><Checkbox checked={field.value?.includes(club.id)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), club.id]) : field.onChange(field.value?.filter((id) => id !== club.id))} /></FormControl><FormLabel className="font-normal">{club.name}</FormLabel></FormItem>)} />))}</ScrollArea><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={form.formState.isSubmitting}>Lưu thay đổi</Button>
            </form></Form>
        </DialogContent></Dialog>
    );
}

function AdminAccessDenied() {
    const supabase = useSupabase();
    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-muted/40 text-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader><CardTitle className="text-2xl font-headline text-destructive">Truy cập bị từ chối</CardTitle><CardDescription>Tài khoản của bạn không có quyền truy cập vào trang quản trị.</CardDescription></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">Chức năng này chỉ dành cho quản trị viên.</p></CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild className="w-full"><Link href="/">Về trang chủ</Link></Button>
                    <Button variant="outline" onClick={() => supabase.auth.signOut()} className="w-full">Đăng xuất</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function AdminAccountLocked() {
    const supabase = useSupabase();
    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-muted/40 text-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader><CardTitle className="text-2xl font-headline text-destructive">Tài khoản bị khóa</CardTitle><CardDescription>Tài khoản của bạn đã bị quản trị viên tạm thời khóa.</CardDescription></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.</p></CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild className="w-full"><Link href="/">Về trang chủ</Link></Button>
                    <Button variant="outline" onClick={() => supabase.auth.signOut()} className="w-full">Đăng xuất</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// Page Export
export default function AdminPage() {
    const { user, loading: authLoading } = useUser();
    const { data: userProfile, loading: profileLoading } = useSupabaseRow<UserProfile>(user ? 'users' : null, user?.id ?? null);

    const loading = authLoading || (user && profileLoading);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Feather className="h-12 w-12 text-primary animate-pulse" />
                    <p className="text-muted-foreground">Đang tải trang quản trị...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <AdminLoginPage />;
    }

    if (user && userProfile) {
        if (userProfile.is_locked) {
            return <AdminAccountLocked />;
        }

        const isAuthorizedAsAdmin = userProfile.role === 'admin';
        const isAuthorizedAsClubOwner = userProfile.role === 'club_owner';
        const isAuthorizedAsStaff = userProfile.role === 'staff';

        if (isAuthorizedAsAdmin || isAuthorizedAsClubOwner || isAuthorizedAsStaff) {
            return (
                <AntdRegistry>
                    <ConfigProvider
                        locale={viVN}
                        theme={{
                            token: {
                                colorPrimary: '#00e640',
                                borderRadius: 8,
                                controlHeight: 40,
                                colorBgContainer: '#f5f9f5',
                                colorBorder: '#dfe6df',
                                fontFamily: 'inherit',
                            },
                            components: {
                                DatePicker: {
                                    activeBorderColor: '#00e640',
                                    hoverBorderColor: '#00e640',
                                    cellActiveWithRangeBg: 'rgba(0, 230, 64, 0.1)',
                                    cellRangeSelectedEdgeBg: 'rgba(0, 230, 64, 0.2)',
                                } as any
                            }
                        }}
                    >
                        <AdminDashboard userProfile={userProfile} />
                    </ConfigProvider>
                </AntdRegistry>
            );
        }
    }

    return <AdminAccessDenied />;
}
