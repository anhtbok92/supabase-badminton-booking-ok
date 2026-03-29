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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1919] border-white/10 text-white selection:bg-[#9cff93] selection:text-[#00440a]">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-3xl font-headline font-black italic uppercase tracking-tighter">Đăng ký đối tác chủ sân</DialogTitle>
                    <DialogDescription className="text-white/40 pt-2 font-body italic">
                        Gói đã chọn: <span className="font-headline font-bold text-[#9cff93] uppercase tracking-widest">{planInfo.displayName}</span> - {planInfo.price.toLocaleString('vi-VN')} VNĐ/tháng
                        <br />
                        Tối đa {planInfo.maxCourts} sân • {planInfo.maxBookings} lượt đặt/tháng
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9cff93]">Họ và tên chủ sân</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nguyễn Văn A" className="bg-white/5 border-white/10 focus:border-[#9cff93] focus:ring-[#9cff93]/20" {...field} />
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
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9cff93]">Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="email@example.com" className="bg-white/5 border-white/10 focus:border-[#9cff93] focus:ring-[#9cff93]/20" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9cff93]">Số điện thoại liên hệ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0901234567" className="bg-white/5 border-white/10 focus:border-[#9cff93] focus:ring-[#9cff93]/20" {...field} />
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
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9cff93]">Tên Câu Lạc Bộ / Sân</FormLabel>
                                        <FormControl>
                                            <Input placeholder="CLB Cầu Lông ABC" className="bg-white/5 border-white/10 focus:border-[#9cff93] focus:ring-[#9cff93]/20" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9cff93]">Địa chỉ sân</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Số 123 đường XYZ..." className="bg-white/5 border-white/10 focus:border-[#9cff93] focus:ring-[#9cff93]/20" {...field} />
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
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9cff93]">Số lượng sân (tối đa 30 sân)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={1} max={30} className="bg-white/5 border-white/10 focus:border-[#9cff93] focus:ring-[#9cff93]/20" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9cff93]">Ghi chú thêm (tùy chọn)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Mô tả thêm về sân hoặc yêu cầu đặc biệt..."
                                            className="resize-none bg-white/5 border-white/10 focus:border-[#9cff93] focus:ring-[#9cff93]/20"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-4 pt-6">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => onOpenChange(false)} 
                                className="flex-1 font-headline font-bold uppercase text-[10px] tracking-widest border-white/10 hover:bg-white/5"
                            >
                                Hủy
                            </Button>
                            <Button 
                                type="submit" 
                                className="flex-1 bg-[#9cff93] text-[#00440a] font-headline font-black uppercase text-[10px] tracking-[0.2em] hover:shadow-[0_0_20px_rgba(156,255,147,0.4)] hover:bg-[#9cff93]" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Hoàn tất đăng ký ngay'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
