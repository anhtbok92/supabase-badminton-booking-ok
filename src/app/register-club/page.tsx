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
    email: z.string().email('Email không hợp lệ'),
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

    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<RegisterClubFormValues>({
        resolver: zodResolver(registerClubSchema),
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

    const onSubmit = async (values: RegisterClubFormValues) => {
        setIsSubmitting(true);

        try {
            // Call the instant registration API
            const response = await fetch('/api/register-owner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...values,
                    planName: 'FREE', // Default to FREE plan
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
                description: error.message || "Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.",
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
                                        <FormLabel>Số lượng sân</FormLabel>
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
                                        Đang đăng ký...
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
