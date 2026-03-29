'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Send, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/supabase';

const registerOwnerSchema = z.object({
    fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phoneNumber: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
    clubName: z.string().min(3, 'Tên câu lạc bộ phải có ít nhất 3 ký tự'),
    courtCount: z.coerce.number().min(1, 'Số lượng sân phải lớn hơn 0').max(30, 'Tối đa 30 sân'),
    address: z.string().min(5, 'Địa chỉ phải chi tiết'),
    note: z.string().optional(),
});

type RegisterOwnerFormValues = z.infer<typeof registerOwnerSchema>;

const PLANS = {
    FREE: { name: 'FREE', displayName: 'Gói Cơ bản', price: 0, maxCourts: 3, maxBookings: 100 },
    BASIC: { name: 'BASIC', displayName: 'Gói Mở rộng', price: 200000, maxCourts: 10, maxBookings: 1000 },
    PRO: { name: 'PRO', displayName: 'Gói Chuyên nghiệp', price: 500000, maxCourts: 30, maxBookings: 3000 },
};

export default function RegisterOwnerPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const supabase = useSupabase();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS>('FREE');

    useEffect(() => {
        const plan = searchParams.get('plan')?.toUpperCase() as keyof typeof PLANS;
        if (plan && PLANS[plan]) {
            setSelectedPlan(plan);
        }
    }, [searchParams]);

    const form = useForm<RegisterOwnerFormValues>({
        resolver: zodResolver(registerOwnerSchema),
        defaultValues: {
            fullName: '',
            email: '',
            phoneNumber: '',
            clubName: '',
            courtCount: 1,
            address: '',
            note: '',
        },
    });

    const courtCount = form.watch('courtCount');
    const planInfo = PLANS[selectedPlan];

    const onSubmit = async (values: RegisterOwnerFormValues) => {
        // Validate court count against plan
        if (values.courtCount > planInfo.maxCourts) {
            toast({
                title: "Vượt quá giới hạn",
                description: `Gói ${planInfo.displayName} chỉ hỗ trợ tối đa ${planInfo.maxCourts} sân. Vui lòng chọn gói cao hơn.`,
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Call API to create owner account, club, and send email
            const response = await fetch('/api/register-owner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...values,
                    planName: selectedPlan,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Có lỗi xảy ra');
            }

            toast({
                title: "Đăng ký thành công!",
                description: "Thông tin đăng nhập đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
            });

            router.push('/');

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Lỗi",
                description: error.message || "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container max-w-2xl mx-auto p-4 space-y-6 pb-20">
            <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold font-headline">Đăng ký chủ sân</h1>
            </div>

            {/* Selected Plan Display */}
            <Card className="border-primary">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Gói đã chọn: {planInfo.displayName}</span>
                        <span className="text-primary">{planInfo.price.toLocaleString('vi-VN')} VNĐ/tháng</span>
                    </CardTitle>
                    <CardDescription>
                        Tối đa {planInfo.maxCourts} sân • {planInfo.maxBookings} lượt đặt/tháng
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin đăng ký</CardTitle>
                    <CardDescription>
                        Điền thông tin để trở thành đối tác chủ sân của chúng tôi.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Họ và tên chủ sân</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nguyễn Văn A" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="email@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số điện thoại liên hệ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0901234567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="clubName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên Câu Lạc Bộ / Sân</FormLabel>
                                        <FormControl>
                                            <Input placeholder="CLB Cầu Lông ABC" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Địa chỉ sân</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Số 123 đường XYZ..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="courtCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số lượng sân (tối đa {planInfo.maxCourts} sân)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={1} max={planInfo.maxCourts} {...field} />
                                        </FormControl>
                                        {courtCount > planInfo.maxCourts && (
                                            <p className="text-sm text-destructive">
                                                Gói {planInfo.displayName} chỉ hỗ trợ tối đa {planInfo.maxCourts} sân
                                            </p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ghi chú thêm</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Mô tả thêm về sân hoặc yêu cầu đặc biệt..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Hoàn tất đăng ký
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
