'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AntdRegistry } from '@ant-design/nextjs-registry';

import { useSupabase, useUser, useSupabaseRow } from '@/supabase';
import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Feather } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { loginSchema, type LoginSchema } from './_components/schemas';
import { AdminDashboard } from './_components/admin-dashboard';

function AdminLoginPage() {
    const supabase = useSupabase();
    const [loginError, setLoginError] = useState('');

    const form = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '', rememberMe: false },
    });

    const onSubmit = async (values: LoginSchema) => {
        setLoginError('');
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });
            if (error) {
                if (error.message?.includes('Invalid login credentials')) {
                    setLoginError('Email hoặc mật khẩu không chính xác.');
                } else {
                    setLoginError('Đã xảy ra lỗi. Vui lòng thử lại.');
                }
            }
        } catch (error: any) {
            console.error(error);
            setLoginError('Đã xảy ra lỗi. Vui lòng thử lại.');
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Đăng nhập Admin</CardTitle>
                    <CardDescription>Nhập email và mật khẩu của bạn để tiếp tục.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem> <FormLabel>Email</FormLabel> <FormControl><Input placeholder="admin@example.com" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField control={form.control} name="password" render={({ field }) => (<FormItem> <FormLabel>Mật khẩu</FormLabel> <FormControl><Input type="password" {...field} /></FormControl> <FormMessage /> </FormItem>)} />
                            <FormField
                                control={form.control}
                                name="rememberMe"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                id="rememberMe"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="grid gap-1.5 leading-none">
                                            <Label
                                                htmlFor="rememberMe"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                Ghi nhớ đăng nhập
                                            </Label>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            {loginError && <p className="text-sm font-medium text-destructive">{loginError}</p>}
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}> {form.formState.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'} </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

function AdminAccessDenied() {
    const supabase = useSupabase();
    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-muted/40 text-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader><CardTitle className="text-2xl font-headline text-destructive">Truy cập bị từ chối</CardTitle><CardDescription>Tài khoản của bạn không có quyền truy cập vào trang quản trị.</CardDescription></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">Chức năng này chỉ dành cho quản trị viên.</p></CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild className="w-full"><Link href="/">Về trang chủ</Link></Button>
                    <Button variant="outline" onClick={() => supabase.auth.signOut()} className="w-full">Đăng xuất</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function AdminAccountLocked() {
    const supabase = useSupabase();
    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-muted/40 text-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader><CardTitle className="text-2xl font-headline text-destructive">Tài khoản bị khóa</CardTitle><CardDescription>Tài khoản của bạn đã bị quản trị viên tạm thời khóa.</CardDescription></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.</p></CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild className="w-full"><Link href="/">Về trang chủ</Link></Button>
                    <Button variant="outline" onClick={() => supabase.auth.signOut()} className="w-full">Đăng xuất</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function AdminPage() {
    const { user, loading: authLoading } = useUser();
    const { data: userProfile, loading: profileLoading } = useSupabaseRow<UserProfile>(user ? 'users' : null, user?.id ?? null);

    const loading = authLoading || (user && profileLoading);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Feather className="h-12 w-12 text-primary animate-pulse" />
                    <p className="text-muted-foreground">Đang tải trang quản trị...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <AdminLoginPage />;
    }

    // User exists but profile not yet loaded — keep showing loading
    if (user && !userProfile) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Feather className="h-12 w-12 text-primary animate-pulse" />
                    <p className="text-muted-foreground">Đang tải trang quản trị...</p>
                </div>
            </div>
        );
    }

    if (user && userProfile) {
        if (userProfile.is_locked) {
            return <AdminAccountLocked />;
        }

        const isAuthorizedAsAdmin = userProfile.role === 'admin';
        const isAuthorizedAsClubOwner = userProfile.role === 'club_owner';
        const isAuthorizedAsStaff = userProfile.role === 'staff';

        if (isAuthorizedAsAdmin || isAuthorizedAsClubOwner || isAuthorizedAsStaff) {
            return (
                <AntdRegistry>
                    <ConfigProvider
                        locale={viVN}
                        theme={{
                            token: {
                                colorPrimary: '#00e640',
                                borderRadius: 8,
                                controlHeight: 40,
                                colorBgContainer: '#f5f9f5',
                                colorBorder: '#dfe6df',
                                fontFamily: 'inherit',
                            },
                            components: {
                                DatePicker: {
                                    activeBorderColor: '#00e640',
                                    hoverBorderColor: '#00e640',
                                    cellActiveWithRangeBg: 'rgba(0, 230, 64, 0.1)',
                                    cellRangeSelectedEdgeBg: 'rgba(0, 230, 64, 0.2)',
                                } as any
                            }
                        }}
                    >
                        <AdminDashboard userProfile={userProfile} />
                    </ConfigProvider>
                </AntdRegistry>
            );
        }
    }

    return <AdminAccessDenied />;
}
