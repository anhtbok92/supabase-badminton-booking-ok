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
    FREE: { name: 'FREE', displayName: 'Gói Dùng Thử 3 Tháng', price: 0, maxCourts: 'Không giới hạn', maxBookings: 'Không giới hạn' },
    BASIC: { name: 'BASIC', displayName: 'Gói Mở rộng', price: 200000, maxCourts: '10', maxBookings: '1.000' },
    PRO: { name: 'PRO', displayName: 'Gói Chuyên nghiệp', price: 500000, maxCourts: '30', maxBookings: '3.000' },
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--lp-bg)] border border-[var(--lp-border)] text-[var(--lp-text)] selection:bg-[var(--lp-accent-bg)] selection:text-[#00440a] p-4 md:p-6">
                <DialogHeader className="mb-4 md:mb-6">
                    <DialogTitle className="text-xl md:text-3xl font-headline font-black italic uppercase tracking-tighter">Đăng ký đối tác chủ sân</DialogTitle>
                    <DialogDescription className="text-[var(--lp-text-muted)] pt-2 font-body italic">
                        Gói đã chọn: <span className="font-headline font-bold text-[var(--lp-accent)] uppercase tracking-widest">{planInfo.displayName}</span> - {planInfo.price === 0 ? 'MIỄN PHÍ' : `${planInfo.price.toLocaleString('vi-VN')} VNĐ/tháng`}
                        <br />
                        <span className="font-bold text-[var(--lp-text-secondary)]">{planInfo.maxCourts}</span> sân • <span className="font-bold text-[var(--lp-text-secondary)]">{planInfo.maxBookings}</span> lượt đặt/tháng
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--lp-accent)]">Họ và tên chủ sân</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nguyễn Văn A" className="bg-[var(--lp-bg-card)] border-[var(--lp-border)] focus:border-[var(--lp-accent)] focus:ring-[var(--lp-accent-light)]" {...field} />
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
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--lp-accent)]">Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="email@example.com" className="bg-[var(--lp-bg-card)] border-[var(--lp-border)] focus:border-[var(--lp-accent)] focus:ring-[var(--lp-accent-light)]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--lp-accent)]">Số điện thoại liên hệ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0901234567" className="bg-[var(--lp-bg-card)] border-[var(--lp-border)] focus:border-[var(--lp-accent)] focus:ring-[var(--lp-accent-light)]" {...field} />
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
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--lp-accent)]">Tên Câu Lạc Bộ / Sân</FormLabel>
                                        <FormControl>
                                            <Input placeholder="CLB Cầu Lông ABC" className="bg-[var(--lp-bg-card)] border-[var(--lp-border)] focus:border-[var(--lp-accent)] focus:ring-[var(--lp-accent-light)]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--lp-accent)]">Địa chỉ sân</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Số 123 đường XYZ..." className="bg-[var(--lp-bg-card)] border-[var(--lp-border)] focus:border-[var(--lp-accent)] focus:ring-[var(--lp-accent-light)]" {...field} />
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
                                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--lp-accent)]">Số lượng sân (tối đa 30 sân)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={1} max={30} className="bg-[var(--lp-bg-card)] border-[var(--lp-border)] focus:border-[var(--lp-accent)] focus:ring-[var(--lp-accent-light)]" {...field} />
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
                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--lp-accent)]">Ghi chú thêm (tùy chọn)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Mô tả thêm về sân hoặc yêu cầu đặc biệt..."
                                            className="resize-none bg-[var(--lp-bg-card)] border-[var(--lp-border)] focus:border-[var(--lp-accent)] focus:ring-[var(--lp-accent-light)]"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-3 md:gap-4 pt-4 md:pt-6">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => onOpenChange(false)} 
                                className="flex-1 font-headline font-bold uppercase text-[10px] tracking-widest border-[var(--lp-border)] text-[var(--lp-text-secondary)] hover:bg-[var(--lp-bg-card)]"
                            >
                                Hủy
                            </Button>
                            <Button 
                                type="submit" 
                                className="flex-1 bg-[var(--lp-accent-bg)] text-[#00440a] font-headline font-black uppercase text-[10px] tracking-[0.2em] hover:shadow-[0_0_20px_var(--lp-accent-glow)] hover:bg-[var(--lp-accent-bg)]" 
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
