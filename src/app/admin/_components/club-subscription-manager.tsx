'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase, useSupabaseQuery } from '@/supabase';
import type { Club, ClubSubscription, SubscriptionPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Pencil, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { clubSubscriptionSchema, type ClubSubscriptionSchema } from './schemas';

type ClubWithSubscription = Club & {
    subscription?: ClubSubscription;
};

export function ClubSubscriptionManager() {
    const supabase = useSupabase();
    const { data: clubs, loading: clubsLoading, refetch: refetchClubs } = useSupabaseQuery<Club>('clubs');
    const { data: subscriptions, loading: subscriptionsLoading, refetch: refetchSubscriptions } = useSupabaseQuery<ClubSubscription>('club_subscriptions');
    const { data: plans, loading: plansLoading } = useSupabaseQuery<SubscriptionPlan>('subscription_plans');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedClub, setSelectedClub] = useState<ClubWithSubscription | undefined>(undefined);
    const { toast } = useToast();

    const loading = clubsLoading || subscriptionsLoading || plansLoading;

    // Merge clubs with their active subscriptions
    const clubsWithSubscriptions = useMemo<ClubWithSubscription[]>(() => {
        if (!clubs || !subscriptions || !plans) return [];

        return clubs.map(club => {
            const activeSubscription = subscriptions.find(
                sub => sub.club_id === club.id && sub.is_active
            );

            if (activeSubscription) {
                const plan = plans.find(p => p.id === activeSubscription.plan_id);
                return {
                    ...club,
                    subscription: {
                        ...activeSubscription,
                        plan,
                    },
                };
            }

            return club;
        });
    }, [clubs, subscriptions, plans]);

    const getSubscriptionStatus = (subscription?: ClubSubscription): 'active' | 'expiring_soon' | 'expired' => {
        if (!subscription || !subscription.is_active) return 'expired';

        const endDate = new Date(subscription.end_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 0) return 'expired';
        if (daysUntilExpiry <= 7) return 'expiring_soon';
        return 'active';
    };

    const getStatusBadge = (status: 'active' | 'expiring_soon' | 'expired') => {
        const variants = {
            active: { variant: 'default' as const, label: 'Đang hoạt động' },
            expiring_soon: { variant: 'secondary' as const, label: 'Sắp hết hạn' },
            expired: { variant: 'destructive' as const, label: 'Hết hạn' },
        };

        const config = variants[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const handleAssignSubscription = (club: ClubWithSubscription) => {
        setSelectedClub(club);
        setDialogOpen(true);
    };

    const refetch = () => {
        refetchClubs();
        refetchSubscriptions();
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Quản lý Gói đăng ký Câu lạc bộ</CardTitle>
                        <CardDescription>
                            Gán và quản lý gói đăng ký cho từng câu lạc bộ
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading && (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                )}

                {!loading && clubsWithSubscriptions && clubsWithSubscriptions.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên câu lạc bộ</TableHead>
                                <TableHead>Gói hiện tại</TableHead>
                                <TableHead>Chu kỳ</TableHead>
                                <TableHead>Ngày bắt đầu</TableHead>
                                <TableHead>Ngày kết thúc</TableHead>
                                <TableHead>Tự động gia hạn</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clubsWithSubscriptions.map((club) => {
                                const status = getSubscriptionStatus(club.subscription);
                                const subscription = club.subscription;

                                return (
                                    <TableRow key={club.id}>
                                        <TableCell>
                                            <div className="font-medium">{club.name}</div>
                                            <div className="text-sm text-muted-foreground">{club.address}</div>
                                        </TableCell>
                                        <TableCell>
                                            {subscription?.plan ? (
                                                <div>
                                                    <div className="font-medium">{subscription.plan.display_name}</div>
                                                    <Badge variant="outline" className="mt-1">
                                                        {subscription.plan.name}
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Chưa có gói</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {subscription ? (
                                                subscription.billing_cycle === 'monthly' ? 'Tháng' : 'Năm'
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {subscription ? formatDate(subscription.start_date) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {subscription ? formatDate(subscription.end_date) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {subscription ? (
                                                subscription.auto_renew ? (
                                                    <Badge variant="default">Có</Badge>
                                                ) : (
                                                    <Badge variant="outline">Không</Badge>
                                                )
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleAssignSubscription(club)}
                                                title={subscription ? 'Thay đổi gói' : 'Gán gói'}
                                            >
                                                {subscription ? (
                                                    <Pencil className="h-4 w-4" />
                                                ) : (
                                                    <PlusCircle className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    !loading && (
                        <p className="text-center text-muted-foreground py-8">
                            Chưa có câu lạc bộ nào trong hệ thống.
                        </p>
                    )
                )}
            </CardContent>

            {dialogOpen && selectedClub && (
                <SubscriptionAssignmentDialog
                    key={selectedClub.id}
                    isOpen={dialogOpen}
                    setIsOpen={setDialogOpen}
                    club={selectedClub}
                    plans={plans || []}
                    onSuccess={refetch}
                />
            )}
        </Card>
    );
}

function SubscriptionAssignmentDialog({
    isOpen,
    setIsOpen,
    club,
    plans,
    onSuccess,
}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    club: ClubWithSubscription;
    plans: SubscriptionPlan[];
    onSuccess?: () => void;
}) {
    const supabase = useSupabase();
    const { toast } = useToast();
    const isEditMode = !!club.subscription;

    // Filter only active plans
    const activePlans = plans.filter(p => p.is_active);

    const form = useForm<ClubSubscriptionSchema>({
        resolver: zodResolver(clubSubscriptionSchema),
        defaultValues: {
            club_id: club.id,
            plan_id: club.subscription?.plan_id ?? '',
            billing_cycle: club.subscription?.billing_cycle ?? 'monthly',
            start_date: club.subscription?.start_date ?? new Date().toISOString().split('T')[0],
            auto_renew: club.subscription?.auto_renew ?? false,
        },
    });

    const watchedPlanId = form.watch('plan_id');
    const watchedBillingCycle = form.watch('billing_cycle');
    const watchedStartDate = form.watch('start_date');

    // Calculate end date based on plan and billing cycle
    const calculatedEndDate = useMemo(() => {
        if (!watchedStartDate) return '';

        const startDate = new Date(watchedStartDate);
        const endDate = new Date(startDate);

        if (watchedBillingCycle === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        return endDate.toISOString().split('T')[0];
    }, [watchedStartDate, watchedBillingCycle]);

    const selectedPlan = useMemo(() => {
        return plans.find(p => p.id === watchedPlanId);
    }, [watchedPlanId, plans]);

    const onSubmit = async (values: ClubSubscriptionSchema) => {
        try {
            // Calculate end_date
            const startDate = new Date(values.start_date);
            const endDate = new Date(startDate);

            if (values.billing_cycle === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            } else {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }

            const subscriptionData = {
                club_id: values.club_id,
                plan_id: values.plan_id,
                billing_cycle: values.billing_cycle,
                start_date: values.start_date,
                end_date: endDate.toISOString().split('T')[0],
                is_active: true,
                auto_renew: values.auto_renew,
            };

            if (isEditMode && club.subscription) {
                // Deactivate old subscription
                const { error: deactivateError } = await supabase
                    .from('club_subscriptions')
                    .update({ is_active: false })
                    .eq('id', club.subscription.id);

                if (deactivateError) {
                    toast({
                        title: 'Lỗi',
                        description: 'Không thể cập nhật gói đăng ký cũ.',
                        variant: 'destructive',
                    });
                    return;
                }

                // Create new subscription
                const { data: newSubscription, error: createError } = await supabase
                    .from('club_subscriptions')
                    .insert(subscriptionData)
                    .select()
                    .single();

                if (createError) {
                    toast({
                        title: 'Lỗi',
                        description: createError.message || 'Không thể tạo gói đăng ký mới.',
                        variant: 'destructive',
                    });
                    return;
                }

                // Update club's current_subscription_id
                const { error: updateClubError } = await supabase
                    .from('clubs')
                    .update({ current_subscription_id: newSubscription.id })
                    .eq('id', club.id);

                if (updateClubError) {
                    toast({
                        title: 'Cảnh báo',
                        description: 'Đã tạo gói mới nhưng không thể cập nhật câu lạc bộ.',
                        variant: 'destructive',
                    });
                }
            } else {
                // Create new subscription
                const { data: newSubscription, error: createError } = await supabase
                    .from('club_subscriptions')
                    .insert(subscriptionData)
                    .select()
                    .single();

                if (createError) {
                    toast({
                        title: 'Lỗi',
                        description: createError.message || 'Không thể gán gói đăng ký.',
                        variant: 'destructive',
                    });
                    return;
                }

                // Update club's current_subscription_id
                const { error: updateClubError } = await supabase
                    .from('clubs')
                    .update({ current_subscription_id: newSubscription.id })
                    .eq('id', club.id);

                if (updateClubError) {
                    toast({
                        title: 'Cảnh báo',
                        description: 'Đã tạo gói mới nhưng không thể cập nhật câu lạc bộ.',
                        variant: 'destructive',
                    });
                }
            }

            toast({
                title: 'Thành công',
                description: `Đã ${isEditMode ? 'thay đổi' : 'gán'} gói đăng ký cho câu lạc bộ "${club.name}".`,
            });

            setIsOpen(false);
            onSuccess?.();
        } catch (error: any) {
            console.error('Error assigning subscription:', error);
            toast({
                title: 'Lỗi',
                description: 'Đã xảy ra lỗi không mong muốn.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="font-headline">
                        {isEditMode ? 'Thay đổi Gói đăng ký' : 'Gán Gói đăng ký'}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        Câu lạc bộ: <span className="font-medium">{club.name}</span>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="plan_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Chọn gói đăng ký</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn gói..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {activePlans.length === 0 ? (
                                                <SelectItem value="none" disabled>
                                                    Không có gói nào khả dụng
                                                </SelectItem>
                                            ) : (
                                                activePlans.map((plan) => (
                                                    <SelectItem key={plan.id} value={plan.id}>
                                                        {plan.display_name} ({plan.name})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedPlan && (
                            <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                                <h4 className="font-semibold text-sm">Thông tin gói</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Số sân tối đa:</span>
                                        <span className="ml-2 font-medium">{selectedPlan.max_courts} sân</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Booking/tháng:</span>
                                        <span className="ml-2 font-medium">{selectedPlan.max_bookings_per_month}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Giá tháng:</span>
                                        <span className="ml-2 font-medium">
                                            {new Intl.NumberFormat('vi-VN').format(selectedPlan.monthly_price)} VND
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Giá năm:</span>
                                        <span className="ml-2 font-medium">
                                            {new Intl.NumberFormat('vi-VN').format(selectedPlan.yearly_price)} VND
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="billing_cycle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Chu kỳ thanh toán</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn chu kỳ..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="monthly">Hàng tháng</SelectItem>
                                            <SelectItem value="yearly">Hàng năm</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="start_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngày bắt đầu</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {calculatedEndDate && (
                            <div className="rounded-lg border p-4 bg-primary/5 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                <div>
                                    <div className="text-sm font-medium">Ngày kết thúc (tự động tính)</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(calculatedEndDate).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="auto_renew"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel>Tự động gia hạn</FormLabel>
                                        <FormDescription>
                                            Gói sẽ tự động gia hạn khi hết hạn
                                        </FormDescription>
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
                            disabled={form.formState.isSubmitting || !watchedPlanId}
                        >
                            {form.formState.isSubmitting ? 'Đang lưu...' : isEditMode ? 'Cập nhật gói' : 'Gán gói'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
