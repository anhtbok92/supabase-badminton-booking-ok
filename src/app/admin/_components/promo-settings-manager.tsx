'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings2, Eye } from 'lucide-react';
import { promoPopupSchema, type PromoPopupSchema } from './schemas';
import type { PromoPopupConfig, SiteSetting } from '@/lib/types';

export function PromoSettingsManager() {
    const supabase = useSupabase();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<PromoPopupSchema>({
        resolver: zodResolver(promoPopupSchema),
        defaultValues: {
            is_active: true,
            badge: 'Ưu đãi đặc biệt',
            title: 'Dùng thử miễn phí trọn bộ 3 tháng',
            description: 'Trải nghiệm toàn bộ tính năng PRO, không cần thẻ tín dụng.',
            cta_text: 'Đăng ký ngay — Miễn phí',
            sub_text: 'Không ràng buộc • Hủy bất cứ lúc nào',
            delay_ms: 1500,
            features: '',
        },
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('key', 'promo_popup')
                .single();

            if (error && error.code !== 'PGRST116') {
                toast({
                    title: 'Lỗi',
                    description: 'Không thể tải cấu hình popup.',
                    variant: 'destructive',
                });
            } else if (data) {
                const config = data.value as PromoPopupConfig;
                form.reset({
                    is_active: config.is_active,
                    badge: config.badge,
                    title: config.title,
                    description: config.description,
                    cta_text: config.cta_text,
                    sub_text: config.sub_text,
                    delay_ms: config.delay_ms,
                    features: config.features?.join('\n') || '',
                });
            }
            setLoading(false);
        };

        fetchSettings();
    }, [supabase, form, toast]);

    const onSubmit = async (values: PromoPopupSchema) => {
        setIsSaving(true);
        const config: PromoPopupConfig = {
            is_active: values.is_active,
            badge: values.badge,
            title: values.title,
            description: values.description,
            cta_text: values.cta_text,
            sub_text: values.sub_text,
            delay_ms: values.delay_ms,
            features: values.features ? values.features.split('\n').filter(f => f.trim() !== '') : [],
        };

        const { error } = await supabase
            .from('site_settings')
            .upsert({
                key: 'promo_popup',
                value: config,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });

        if (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể lưu cấu hình.',
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Thành công',
                description: 'Đã cập nhật cấu hình popup ưu đãi.',
            });
        }
        setIsSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        <div>
                            <CardTitle>Cấu hình Popup Ưu đãi</CardTitle>
                            <CardDescription>
                                Quản lý nội dung và trạng thái hiển thị của popup khuyến mãi trên landing page
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Trạng thái hiển thị</FormLabel>
                                            <FormDescription>
                                                Bật hoặc tắt popup trên trang chủ landing page
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="badge"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nhãn (Badge)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ưu đãi đặc biệt" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="delay_ms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Thời gian chờ hiển thị (ms)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="100" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Ví dụ: 1500 = 1.5 giây sau khi tải trang
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tiêu đề chính</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Dùng thử miễn phí trọn bộ 3 tháng" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mô tả ngắn</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Trải nghiệm toàn bộ tính năng PRO, không cần thẻ tín dụng." 
                                                className="resize-none"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="cta_text"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Chữ trên nút (CTA)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Đăng ký ngay — Miễn phí" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sub_text"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ghi chú dưới nút</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Không ràng buộc • Hủy bất cứ lúc nào" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="features"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Danh sách đặc điểm (Mỗi dòng một ý)</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Kết nối không giới hạn\nHỗ trợ 24/7\nQuản lý chuyên sâu" 
                                                className="min-h-[150px]"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-4">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="min-w-[150px]"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : 'Lưu cấu hình'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="bg-muted/50 border-dashed">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-muted-foreground" />
                        <CardTitle className="text-sm">Ghi chú</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• Các thay đổi sẽ có hiệu lực ngay lập tức cho các khách truy cập mới hoặc sau khi họ làm mới trang.</p>
                    <p>• Popup sử dụng session storage để tránh làm phiền, nên nó chỉ hiển thị lại sau khi khách hàng đóng trình duyệt và mở lại.</p>
                    <p>• Màu sắc và giao diện của popup hiện tại được thiết kế đồng bộ với nhận diện thương hiệu Sport Booking (Xanh lục/Đen).</p>
                </CardContent>
            </Card>
        </div>
    );
}
