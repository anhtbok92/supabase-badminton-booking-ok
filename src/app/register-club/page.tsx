'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSupabase, useUser } from '@/supabase';

const registerClubSchema = z.object({
    fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
    phoneNumber: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
    clubName: z.string().min(3, 'Tên câu lạc bộ phải có ít nhất 3 ký tự'),
    courtCount: z.coerce.number().min(1, 'Số lượng sân phải lớn hơn 0'),
    address: z.string().min(5, 'Địa chỉ phải chi tiết'),
    note: z.string().optional(),
});

type RegisterClubFormValues = z.infer<typeof registerClubSchema>;

export default function RegisterClubPage() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = useSupabase();
    const { user } = useUser();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<RegisterClubFormValues>({
        resolver: zodResolver(registerClubSchema),
        defaultValues: {
            fullName: '',
            phoneNumber: '',
            clubName: '',
            courtCount: 1,
            address: '',
            note: '',
        },
    });

    const onSubmit = async (values: RegisterClubFormValues) => {
        setIsSubmitting(true);

        try {
            const defaultPricing = {
                weekday: [
                    { timeRange: ['05:00', '24:00'], price: 40000 }
                ],
                weekend: [
                    { timeRange: ['05:00', '24:00'], price: 40000 }
                ]
            };

            const clubData = {
                name: values.clubName,
                address: values.address,
                phone: values.phoneNumber,
                club_type: 'other',
                is_active: false,
                verification_status: 'pending',
                owner_name: values.fullName,
                owner_phone: values.phoneNumber,
                number_of_courts: values.courtCount,
                description: values.note || null,
                owner_id: user?.id || null,
                pricing: defaultPricing,
            };

            const { error } = await supabase.from('clubs').insert(clubData);
            if (error) throw error;

            // Gửi email thông báo cho admin
            try {
                const emailResponse = await fetch('/api/notify-registration', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(values),
                });
                const emailResult = await emailResponse.json();
                console.log('Email notification result:', emailResult);
                
                if (!emailResponse.ok) {
                    console.error('Email notification failed:', emailResult);
                }
            } catch (emailError) {
                console.error('Email notification error:', emailError);
            }

            toast({
                title: "Gửi yêu cầu thành công!",
                description: "Yêu cầu đăng ký chủ sân của bạn đã được gửi. Chúng tôi sẽ liên hệ sớm.",
            });

            router.push('/booking');

        } catch (error) {
            console.error(error);
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container max-w-lg mx-auto p-4 space-y-6 pb-20">
            <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold font-headline">Đăng ký chủ sân</h1>
            </div>

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
                                        <FormLabel>Số lượng sân dự kiến</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={1} {...field} />
                                        </FormControl>
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
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Gửi yêu cầu
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
