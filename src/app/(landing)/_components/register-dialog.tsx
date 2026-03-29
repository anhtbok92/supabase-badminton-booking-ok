'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';

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

interface RegisterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedPlan: keyof typeof PLANS;
}

export function RegisterDialog({ open, onOpenChange, selectedPlan }: RegisterDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const planInfo = PLANS[selectedPlan];

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

    const onSubmit = async (values: RegisterOwnerFormValues) => {
        setIsSubmitting(true);

        try {
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

            form.reset();
            onOpenChange(false);

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Đăng ký chủ sân</DialogTitle>
                    <DialogDescription>
                        Gói đã chọn: <span className="font-bold text-primary">{planInfo.displayName}</span> - {planInfo.price.toLocaleString('vi-VN')} VNĐ/tháng
                        <br />
                        Tối đa {planInfo.maxCourts} sân • {planInfo.maxBookings} lượt đặt/tháng
                    </DialogDescription>
                </DialogHeader>

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
                                    <FormLabel>Số lượng sân (tối đa 30 sân)</FormLabel>
                                    <FormControl>
                                        <Input type="number" min={1} max={30} {...field} />
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
                                    <FormLabel>Ghi chú thêm (tùy chọn)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Mô tả thêm về sân hoặc yêu cầu đặc biệt..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                                Hủy
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isSubmitting}>
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
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
