'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { SubscriptionPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subscriptionPlanSchema, type SubscriptionPlanSchema } from './schemas';

export function SubscriptionPlanManager() {
    const supabase = useSupabase();
    const { data: plans, loading, refetch } = useSupabaseQuery<SubscriptionPlan>('subscription_plans');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | undefined>(undefined);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
    const { toast } = useToast();

    const handleToggleActive = async (plan: SubscriptionPlan) => {
        const newIsActive = !plan.is_active;
        const { error } = await supabase
            .from('subscription_plans')
            .update({ is_active: newIsActive })
            .eq('id', plan.id);

        if (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể cập nhật trạng thái gói.',
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Cập nhật thành công',
                description: `Gói "${plan.display_name}" đã được ${newIsActive ? 'kích hoạt' : 'vô hiệu hóa'}.`,
            });
            refetch();
        }
    };

    const confirmDelete = async () => {
        if (!planToDelete) return;

        // Check if plan has active subscriptions
        const { data: activeSubscriptions, error: checkError } = await supabase
            .from('club_subscriptions')
            .select('id')
            .eq('plan_id', planToDelete.id)
            .eq('is_active', true)
            .limit(1);

        if (checkError) {
            toast({
                title: 'Lỗi',
                description: 'Không thể kiểm tra gói đăng ký.',
                variant: 'destructive',
            });
            setDeleteAlertOpen(false);
            setPlanToDelete(null);
            return;
        }

        if (activeSubscriptions && activeSubscriptions.length > 0) {
            toast({
                title: 'Không thể xóa',
                description: 'Gói này đang có câu lạc bộ sử dụng. Vui lòng chuyển các câu lạc bộ sang gói khác trước.',
                variant: 'destructive',
            });
            setDeleteAlertOpen(false);
            setPlanToDelete(null);
            return;
        }

        const { error } = await supabase
            .from('subscription_plans')
            .delete()
            .eq('id', planToDelete.id);

        if (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể xóa gói đăng ký.',
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Thành công',
                description: 'Đã xóa gói đăng ký.',
            });
            refetch();
        }

        setDeleteAlertOpen(false);
        setPlanToDelete(null);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' VND';
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Quản lý Gói đăng ký</CardTitle>
                        <CardDescription>
                            Cấu hình các gói đăng ký với giới hạn tài nguyên và giá cả
                        </CardDescription>
                    </div>
                    <Button onClick={() => { setSelectedPlan(undefined); setDialogOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Thêm Gói
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading && (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                )}

                {!loading && plans && plans.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên gói</TableHead>
                                <TableHead>Giới hạn sân</TableHead>
                                <TableHead>Giới hạn booking/tháng</TableHead>
                                <TableHead>Giá tháng</TableHead>
                                <TableHead>Giá năm</TableHead>
                                <TableHead>Phí vượt mức</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{plan.display_name}</div>
                                            <Badge variant="outline" className="mt-1">
                                                {plan.name}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>{plan.max_courts} sân</TableCell>
                                    <TableCell>{plan.max_bookings_per_month} booking</TableCell>
                                    <TableCell>{formatPrice(plan.monthly_price)}</TableCell>
                                    <TableCell>{formatPrice(plan.yearly_price)}</TableCell>
                                    <TableCell>{formatPrice(plan.overage_fee_per_booking)}/booking</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={plan.is_active}
                                            onCheckedChange={() => handleToggleActive(plan)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedPlan(plan);
                                                    setDialogOpen(true);
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => {
                                                    setPlanToDelete(plan);
                                                    setDeleteAlertOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    !loading && (
                        <p className="text-center text-muted-foreground py-8">
                            Chưa có gói đăng ký nào. Nhấn "Thêm Gói" để tạo gói mới.
                        </p>
                    )
                )}
            </CardContent>

            {dialogOpen && (
                <PlanFormDialog
                    key={selectedPlan?.id || 'new'}
                    isOpen={dialogOpen}
                    setIsOpen={setDialogOpen}
                    plan={selectedPlan}
                    onSuccess={refetch}
                />
            )}

            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Thao tác này sẽ xóa vĩnh viễn gói đăng ký "{planToDelete?.display_name}".
                            Không thể xóa nếu gói đang có câu lạc bộ sử dụng.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

function PlanFormDialog({
    isOpen,
    setIsOpen,
    plan,
    onSuccess,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    plan?: SubscriptionPlan;
    onSuccess?: () => void;
}) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const isEditMode = !!plan;

    const form = useForm<SubscriptionPlanSchema>({
        resolver: zodResolver(subscriptionPlanSchema),
        defaultValues: {
            name: plan?.name ?? 'FREE',
            display_name: plan?.display_name ?? '',
            max_courts: plan?.max_courts ?? 3,
            max_bookings_per_month: plan?.max_bookings_per_month ?? 100,
            monthly_price: plan?.monthly_price ?? 0,
            yearly_price: plan?.yearly_price ?? 0,
            overage_fee_per_booking: plan?.overage_fee_per_booking ?? 0,
            is_active: plan?.is_active ?? true,
            features: plan?.features ?? {
                support: 'email',
                analytics: false,
                custom_features: false,
            },
        },
    });

    const onSubmit = async (values: SubscriptionPlanSchema) => {
        const finalValues = {
            name: values.name,
            display_name: values.display_name,
            max_courts: values.max_courts,
            max_bookings_per_month: values.max_bookings_per_month,
            monthly_price: values.monthly_price,
            yearly_price: values.yearly_price,
            overage_fee_per_booking: values.overage_fee_per_booking,
            is_active: values.is_active,
            features: values.features || {
                support: 'email',
            },
        };

        if (isEditMode && plan) {
            const { error } = await supabase
                .from('subscription_plans')
                .update(finalValues)
                .eq('id', plan.id);

            if (error) {
                toast({
                    title: 'Lỗi',
                    description: error.message || 'Không thể cập nhật gói đăng ký.',
                    variant: 'destructive',
                });
                return;
            }
        } else {
            const { error } = await supabase
                .from('subscription_plans')
                .insert(finalValues);

            if (error) {
                toast({
                    title: 'Lỗi',
                    description: error.message || 'Không thể tạo gói đăng ký.',
                    variant: 'destructive',
                });
                return;
            }
        }

        toast({
            title: 'Thành công',
            description: `Đã ${isEditMode ? 'cập nhật' : 'tạo'} gói đăng ký.`,
        });

        setIsOpen(false);
        onSuccess?.();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="font-headline">
                        {isEditMode ? 'Chỉnh sửa Gói đăng ký' : 'Tạo Gói đăng ký mới'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên gói (Code)</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isEditMode}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn tên gói..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="FREE">FREE</SelectItem>
                                                <SelectItem value="BASIC">BASIC</SelectItem>
                                                <SelectItem value="PRO">PRO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="display_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên hiển thị</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Gói Miễn phí" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="max_courts"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số sân tối đa</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="max_bookings_per_month"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số booking tối đa/tháng</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="monthly_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giá tháng (VND)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="yearly_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giá năm (VND)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="overage_fee_per_booking"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phí vượt mức/booking (VND)</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel>Kích hoạt gói</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            Nếu tắt, gói sẽ không hiển thị khi gán cho câu lạc bộ
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
