'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { UploadCloud, Trash2, ChevronLeft, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { SelectedSlot, Club, Court, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseQuery, useSupabaseRow, useUser, useSupabase } from '@/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { uploadFile } from '@/lib/upload';

const paymentFormSchema = z.object({
    name: z.string().min(2, { message: 'Họ tên phải có ít nhất 2 ký tự.' }),
    phone: z.string().regex(/^[0-9]{10,11}$/, { message: 'Số điện thoại không hợp lệ.' }),
});

function getPriceForSlot(time: string, date: Date, pricing: Club['pricing']): number {
    if (!pricing) return 0;
    const dayOfWeek = getDay(date);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const relevantTiers = isWeekend ? pricing.weekend : pricing.weekday;

    if (!relevantTiers || relevantTiers.length === 0) return 0;

    const [h, m] = time.split(':').map(Number);
    const slotValue = h * 60 + m;

    const sortedTiers = [...relevantTiers].sort((a, b) => {
        // 1. Manually set priority takes precedence
        if (a.is_priority && !b.is_priority) return -1;
        if (!a.is_priority && b.is_priority) return 1;

        const getMinutes = (timeStr: string) => {
            const [sh, sm] = timeStr.split(':').map(Number);
            return (sh === 24 || (sh === 0 && sm === 0)) ? 1440 : sh * 60 + sm;
        };
        const durationA = getMinutes(a.timeRange[1]) - getMinutes(a.timeRange[0]);
        const durationB = getMinutes(b.timeRange[1]) - getMinutes(b.timeRange[0]);
        
        // 2. Shorter duration takes precedence
        if (durationA !== durationB) return durationA - durationB;
        
        // 3. Higher price takes precedence
        return b.price - a.price;
    });

    for (const tier of sortedTiers) {
        const [sh, sm] = tier.timeRange[0].split(':').map(Number);
        const startValue = sh * 60 + sm;
        const [eh, em] = tier.timeRange[1].split(':').map(Number);
        let endValue = eh * 60 + em;
        if ((eh === 0 || eh === 24) && startValue > 0) endValue = 1440;

        if (slotValue >= startValue && slotValue < endValue) {
            return tier.price;
        }
    }
    return 0;
}

function getYoutubeEmbedUrl(url: string | undefined) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
}


function PaymentForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const supabase = useSupabase();
    const { user } = useUser();

    const clubId = searchParams.get('clubId');
    const dateStr = searchParams.get('date');
    const slotsStr = searchParams.get('slots');

    const { data: userProfile } = useSupabaseRow<UserProfile>('users', user?.id ?? null);
    const { data: club, loading: clubLoading } = useSupabaseRow<Club>('clubs', clubId);
    const { data: courts, loading: courtsLoading } = useSupabaseQuery<Court>('courts', q => q.eq('club_id', clubId!), { deps: [clubId] });

    const slots: SelectedSlot[] = useMemo(() => slotsStr ? JSON.parse(decodeURIComponent(slotsStr)) : [], [slotsStr]);
    const date = useMemo(() => dateStr ? new Date(dateStr) : new Date(), [dateStr]);

    const [paymentProofUrls, setPaymentProofUrls] = useState<string[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState<{ name: string }[]>([]);

    const form = useForm<z.infer<typeof paymentFormSchema>>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: { name: '', phone: '' },
    });

    useEffect(() => {
        if (userProfile?.phone) {
            form.setValue('phone', userProfile.phone);
        }
    }, [userProfile, form]);

    const loading = clubLoading || courtsLoading;

    const totalPrice = useMemo(() => {
        if (!club?.pricing) return 0;
        return slots.reduce((total, slot) => {
            // Use slot.date if available, else fallback to the URL parm date
            const slotDate = slot.date ? new Date(slot.date + 'T00:00:00') : date;
            return total + getPriceForSlot(slot.time, slotDate, club.pricing);
        }, 0);
    }, [club, slots, date]);

    const handleProofUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        if (paymentProofUrls.length + files.length > 2) {
            toast({ title: "Lỗi", description: "Bạn chỉ có thể tải lên tối đa 2 ảnh bằng chứng.", variant: "destructive" });
            return;
        }

        const currentUploading = Array.from(files).map(file => ({ name: file.name }));
        setUploadingFiles(prev => [...prev, ...currentUploading]);

        Array.from(files).forEach(async (file) => {
            try {
                const url = await uploadFile(supabase, 'payment-proofs', file);
                setPaymentProofUrls(prev => [...prev, url]);
            } catch (error) {
                console.error("Upload failed:", error);
                toast({ title: "Lỗi tải lên", description: `Không thể tải lên file ${file.name}.`, variant: "destructive" });
            } finally {
                setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
            }
        });
    };

    const handleProofDelete = (urlToDelete: string) => {
        setPaymentProofUrls(prev => prev.filter(url => url !== urlToDelete));
    };


    const onSubmit = async (values: z.infer<typeof paymentFormSchema>) => {
        if (!club || isSubmitting) return;

        // Check booking quota before submitting
        try {
            const { data: quotaData, error: quotaError } = await supabase.rpc('check_booking_quota', { 
                p_club_id: clubId 
            });
            
            if (!quotaError && quotaData && quotaData.length > 0) {
                const quota = quotaData[0];
                const usagePercentage = quota.usage_percentage || 0;
                
                // Show warning at 80% usage
                if (usagePercentage >= 80 && usagePercentage < 100) {
                    toast({
                        title: 'Cảnh báo quota',
                        description: `Đã sử dụng ${usagePercentage.toFixed(1)}% quota tháng này (${quota.current_count}/${quota.max_allowed} bookings). Cân nhắc nâng cấp gói.`,
                        variant: 'default',
                    });
                }
                
                // Show overage notice at 100%+ usage
                if (usagePercentage >= 100) {
                    toast({
                        title: 'Thông báo vượt quota',
                        description: `Đã vượt quota! Hiện tại: ${quota.current_count}/${quota.max_allowed} bookings. Phí vượt mức: ${new Intl.NumberFormat('vi-VN').format(quota.overage_fee)}đ`,
                        variant: 'destructive',
                    });
                }
            }
        } catch (err) {
            console.error('Failed to check quota:', err);
            // Continue with booking even if quota check fails
        }

        // Group slots by date
        const slotsByDate: Record<string, SelectedSlot[]> = {};
        slots.forEach(slot => {
            const d = slot.date || format(date, 'yyyy-MM-dd');
            if (!slotsByDate[d]) slotsByDate[d] = [];
            slotsByDate[d].push(slot);
        });

        const bookingGroupId = Math.random().toString(36).substring(2, 11).toUpperCase();

        const bookingRows = Object.entries(slotsByDate).map(([bookingDate, dateSlots]) => {
            const slotsWithCourtNames = dateSlots.map(slot => {
                const court = courts?.find(c => c.id === slot.court_id);
                return {
                    ...slot,
                    court_name: court?.name || 'Sân không rõ',
                };
            });

            // Calculate price for this specific booking
            const bookingPrice = dateSlots.reduce((total, slot) => {
                const d = new Date(bookingDate + 'T00:00:00');
                return total + getPriceForSlot(slot.time, d, club.pricing);
            }, 0);

            const newBooking: Record<string, any> = {
                ...values,
                club_id: clubId,
                club_name: club.name,
                date: bookingDate,
                slots: slotsWithCourtNames,
                total_price: bookingPrice,
                status: 'Chờ xác nhận',
                payment_proof_image_urls: paymentProofUrls,
                booking_group_id: bookingGroupId,
            };

            if (user) {
                newBooking.user_id = user.id;
            }

            return newBooking;
        });

        try {
            const { error } = await supabase.from('bookings').insert(bookingRows);
            if (error) throw error;

            // Increment booking count for quota tracking
            // Call once per booking group (not per individual booking row)
            try {
                const { error: quotaError } = await supabase.rpc('increment_booking_count', { 
                    p_club_id: clubId 
                });
                if (quotaError) {
                    console.error('Failed to increment booking count:', quotaError);
                    // Don't fail the booking if quota tracking fails
                }

                // Check quota and send notifications if thresholds are reached
                const { data: quotaData, error: quotaCheckError } = await supabase.rpc('check_booking_quota', {
                    p_club_id: clubId
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
                            .eq('id', clubId)
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
                                    // Don't fail the booking if notification fails
                                }
                            }
                        }
                    }
                }
            } catch (quotaErr) {
                console.error('Quota tracking error:', quotaErr);
            }

            toast({
                title: 'Gửi yêu cầu đặt sân thành công!',
                description: `Đã ghi nhận ${bookingRows.length} lịch đặt. Admin sẽ sớm xác nhận.`,
                variant: 'default',
            });
            router.push('/my-bookings');
        } catch (error: any) {
            console.error("Booking error:", error);
            toast({
                title: 'Ôi, có lỗi!',
                description: 'Không thể gửi yêu cầu đặt sân. Vui lòng thử lại.',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return <PaymentPageSkeleton />;
    }

    if (!club || slots.length === 0) {
        return (
            <div className="text-center py-10 container mx-auto max-w-4xl">
                <p>Chi tiết đặt sân không hợp lệ. Vui lòng thử lại.</p>
                <Button onClick={() => router.push('/')} className="mt-4">Về trang chủ</Button>
            </div>
        );
    }

    const courtNames = [...new Set(slots.map(s => courts?.find(c => c.id === s.court_id)?.name || ''))].join(', ');
    const times = slots.map(s => s.time).sort().join(', ');
    const phoneValue = form.watch('phone');

    // Determine unique dates
    const uniqueDates = Array.from(new Set(slots.map(s => s.date || format(date, 'yyyy-MM-dd')))).sort();
    const formattedDate = uniqueDates.length === 1
        ? format(new Date(uniqueDates[0] + 'T00:00:00'), 'ddMMyyyy')
        : `(${uniqueDates.length} ngày)`;

    const paymentMessage = `${phoneValue || ''} ${formattedDate}`;

    const isSubmitting = form.formState.isSubmitting || uploadingFiles.length > 0;

    const embedUrl = getYoutubeEmbedUrl(club.map_video_url);

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-center mb-8">
                Hoàn tất đặt sân
            </h1>

            <Tabs defaultValue="booking" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="booking">Thanh toán</TabsTrigger>
                    <TabsTrigger value="pricing">Bảng giá</TabsTrigger>
                    <TabsTrigger value="map">Chỉ đường</TabsTrigger>
                </TabsList>

                <TabsContent value="booking" className="space-y-8">
                    {/* QR Code Section - First */}
                    <div className="flex justify-center">
                        <Card className="w-full md:w-2/3 lg:w-1/2 border-2 border-primary/20">
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="font-headline text-2xl text-primary">Quét mã thanh toán</CardTitle>
                                <CardDescription>Vui lòng quét mã QR bên dưới để chuyển khoản</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center space-y-4 pt-2">
                                <div className="relative">
                                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-30 blur-sm"></div>
                                    <Image
                                        src={club.payment_qr_url || "/ma-qr.JPG"}
                                        alt="QR Code"
                                        width={280}
                                        height={280}
                                        className="relative rounded-lg border-4 border-white shadow-xl"
                                        data-ai-hint="qr code"
                                    />
                                </div>
                                <div className="bg-muted/50 w-full p-4 rounded-lg text-center border mt-4">
                                    <p className="text-sm text-muted-foreground mb-1">Nội dung chuyển khoản:</p>
                                    <p className="font-mono text-lg font-bold text-primary select-all tracking-wider">{paymentMessage}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Form */}
                        <div className="space-y-6">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle className="font-headline">Thông tin xác nhận</CardTitle>
                                    <CardDescription>Nhập thông tin để hoàn tất đặt sân</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Họ và tên</FormLabel>
                                                        <FormControl><Input placeholder="Nguyễn Văn A" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Số điện thoại</FormLabel>
                                                        <FormControl><Input placeholder="0901234567" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" className="w-full mt-4 h-12 text-lg font-bold shadow-lg shadow-primary/20" disabled={isSubmitting}>
                                                {form.formState.isSubmitting ? 'Đang gửi...' : (uploadingFiles.length > 0 ? 'Đang tải ảnh...' : 'Xác nhận đặt sân')}
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Summary & Upload */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="font-headline text-lg">Tóm tắt đơn hàng</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="font-semibold text-lg">{club.name}</p>
                                    </div>
                                    <div className="space-y-3">
                                        {uniqueDates.map(dateStr => {
                                            const dateSlots = slots.filter(s => (s.date || format(date, 'yyyy-MM-dd')) === dateStr);
                                            const slotsByCourt: Record<string, string[]> = {};
                                            dateSlots.forEach(s => {
                                                const cName = courts?.find(c => c.id === s.court_id)?.name || 'Sân ?';
                                                if (!slotsByCourt[cName]) slotsByCourt[cName] = [];
                                                slotsByCourt[cName].push(s.time);
                                            });

                                            return (
                                                <div key={dateStr} className="bg-muted/30 p-2 rounded-md space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 font-semibold text-primary">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>{format(new Date(dateStr + 'T00:00:00'), 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
                                                    </div>
                                                    <div className="pl-6 space-y-1.5">
                                                        {Object.entries(slotsByCourt).sort().map(([cName, cTimes]) => {
                                                            const sorted = cTimes.sort();
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
                                                                <div key={cName} className="flex flex-wrap gap-2 items-center">
                                                                    <span className="min-w-[50px] font-medium">{cName}:</span>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {ranges.map(range => (
                                                                            <Badge key={range} variant="secondary" className="px-1.5 h-auto py-0.5 text-xs font-semibold border-primary/20">
                                                                                {range}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="border-t pt-3 flex justify-between items-center text-lg">
                                        <span className="font-semibold">Tổng cộng:</span>
                                        <span className="font-bold font-headline text-primary text-xl">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="font-headline text-lg">Bằng chứng thanh toán (Tùy chọn)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2">
                                        {paymentProofUrls.map((url) => (
                                            <div key={url} className="relative group aspect-square">
                                                <Image src={url} alt="Bằng chứng thanh toán" fill sizes="20vw" className="object-cover rounded-md bg-muted" />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleProofDelete(url)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {paymentProofUrls.length < 2 && (
                                            <label className="flex flex-col items-center justify-center w-full h-full aspect-square border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors">
                                                <div className="flex flex-col items-center justify-center text-center p-2">
                                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground">Tải ảnh</p>
                                                </div>
                                                <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleProofUpload(e.target.files)} disabled={uploadingFiles.length > 0} />
                                            </label>
                                        )}
                                    </div>
                                    {uploadingFiles.length > 0 && (
                                        <div className="space-y-1 mt-2">
                                            <p className="text-xs font-medium text-muted-foreground">Đang tải tên...</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="pricing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bảng giá dịch vụ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {club.price_list_image_url && (
                                    <div className="relative w-full aspect-[3/4] md:aspect-[4/3] rounded-lg overflow-hidden border bg-muted/50">
                                        <Image
                                            src={club.price_list_image_url}
                                            alt="Bảng giá"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                )}

                                {club.price_list_html && (
                                    <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: club.price_list_html }} />
                                )}

                                {!club.price_list_image_url && !club.price_list_html && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Chưa có thông tin bảng giá chi tiết.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="map">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bản đồ chỉ đường</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {embedUrl ? (
                                <div className="aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={embedUrl}
                                        title="Map Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Chưa có video hướng dẫn chỉ đường.
                                </div>
                            )}
                            {club.address && (
                                <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                                    <p className="font-semibold">Địa chỉ:</p>
                                    <p className="text-muted-foreground">{club.address}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function PaymentPageSkeleton() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <Skeleton className="h-10 w-1/2 mx-auto mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card>
                        <CardHeader><Skeleton className="h-7 w-32" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-7 w-40" /></CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-2/3" />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-7 w-28" />
                            <Skeleton className="h-4 w-full mt-2" />
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <Skeleton className="w-[200px] h-[200px] mx-auto rounded-lg" />
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default function PaymentPage() {
    const router = useRouter();
    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b bg-card">
                <div className="container mx-auto flex h-16 items-center px-4">
                    <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                        <span className="sr-only">Quay lại</span>
                    </Button>
                    <h1 className="text-lg font-semibold font-headline truncate">Hoàn tất đặt sân</h1>
                </div>
            </header>
            <Suspense fallback={<PaymentPageSkeleton />}>
                <PaymentForm />
            </Suspense>
        </>
    )
}



