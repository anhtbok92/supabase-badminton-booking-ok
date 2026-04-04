'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AntdRegistry } from '@ant-design/nextjs-registry';

import { useSupabase, useUser } from '@/supabase';
import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Feather, Rocket, Zap, Calendar, Mail, Lock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
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
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f0a] relative overflow-hidden font-body">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
            
            <div className="max-w-4xl w-full mx-4 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 bg-white/5 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                {/* Left side - Branding */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary/20 to-transparent border-r border-white/5 relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-lg shadow-primary/20">
                            <Image src="/favicon.png" alt="Logo" width={32} height={32} />
                        </div>
                        <span className="text-xl font-black italic tracking-tighter text-white font-headline">SPORT BOOKING</span>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-4xl font-headline font-black text-white italic uppercase tracking-tighter leading-none">
                            Làm chủ<br />
                            <span className="text-primary">Sân chơi</span><br />
                            Digital
                        </h1>
                        <p className="text-white/60 text-sm leading-relaxed max-w-[280px]">
                            Hệ thống quản trị thông minh dành cho chủ sân cầu lông chuyên nghiệp. Tối ưu vận hành, bứt phá doanh thu.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-xs text-white/40 uppercase font-black tracking-widest">
                            <Rocket className="h-3 w-3 text-primary" />
                            Fast Ops
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/40 uppercase font-black tracking-widest">
                            <Zap className="h-3 w-3 text-primary" />
                            Real-time
                        </div>
                    </div>
                </div>

                {/* Right side - Login Form */}
                <div className="p-8 lg:p-12 flex flex-col justify-center bg-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <Image src="/favicon.png" alt="Logo" width={28} height={28} className="bg-white rounded p-1" />
                        <span className="text-lg font-black italic tracking-tighter text-white font-headline">SPORT BOOKING</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-black uppercase italic tracking-tight text-white font-headline">Đăng nhập</h2>
                        <p className="text-white/40 text-xs mt-1 uppercase font-bold tracking-widest">Hệ thống quản lý Admin Hub</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField 
                                control={form.control} 
                                name="email" 
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Tài khoản Email</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                                <Input 
                                                    placeholder="admin@sportbooking.online" 
                                                    className="bg-white/5 border-white/10 text-white pl-10 h-12 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all" 
                                                    {...field} 
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-bold" />
                                    </FormItem>
                                )} 
                            />
                            
                            <FormField 
                                control={form.control} 
                                name="password" 
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <div className="flex justify-between items-center px-1">
                                            <FormLabel className="text-[10px] uppercase font-black tracking-widest text-white/40">Mật khẩu</FormLabel>
                                            <Link href="#" className="text-[9px] uppercase font-bold text-primary hover:underline transition-all">Quên mật khẩu?</Link>
                                        </div>
                                        <FormControl>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                                <Input 
                                                    type="password" 
                                                    placeholder="••••••••" 
                                                    className="bg-white/5 border-white/10 text-white pl-10 h-12 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all" 
                                                    {...field} 
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-bold" />
                                    </FormItem>
                                )} 
                            />

                            <FormField
                                control={form.control}
                                name="rememberMe"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 px-1">
                                        <FormControl>
                                            <Checkbox
                                                id="rememberMe"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                        </FormControl>
                                        <Label
                                            htmlFor="rememberMe"
                                            className="text-xs font-bold text-white/40 cursor-pointer select-none"
                                        >
                                            Ghi nhớ đăng nhập
                                        </Label>
                                    </FormItem>
                                )}
                            />

                            {loginError && (
                                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl flex items-center gap-3 animate-shake">
                                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                    <p className="text-[11px] font-bold text-destructive">{loginError}</p>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-[#00440a] font-headline font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_20px_rgba(0,230,64,0.3)] hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all" 
                                disabled={form.formState.isSubmitting}
                            > 
                                {form.formState.isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-[#00440a]/30 border-t-[#00440a] rounded-full animate-spin" />
                                        <span>Đang xử lý...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Đăng nhập ngay</span>
                                        <Zap className="h-4 w-4 fill-[#00440a]" />
                                    </div>
                                )} 
                            </Button>
                        </form>
                    </Form>
                    
                    <p className="mt-8 text-center text-[10px] text-white/20 font-bold uppercase tracking-widest">
                        © 2026 Sport Booking Digital Platform
                    </p>
                </div>
            </div>
        </div>
    );
}

function AdminAccessDenied() {
    const supabase = useSupabase();
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f0a] relative overflow-hidden font-body p-4">
               <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-destructive/10 rounded-full blur-[120px]" />
            
            <Card className="w-full max-w-md bg-white/5 border-white/5 backdrop-blur-xl text-white rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
                <CardHeader className="text-center pt-10">
                    <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-headline font-black italic uppercase tracking-tighter text-destructive">Truy cập bị từ chối</CardTitle>
                    <CardDescription className="text-white/40 uppercase text-[10px] font-bold tracking-widest mt-1">Hạn chế quyền quản trị</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-white/60 leading-relaxed">
                        Tài khoản của bạn không có đủ quyền hạn để truy cập vào hệ thống Admin Hub. Vui lòng liên hệ quản trị viên cấp cao nếu bạn cho rằng đây là một lỗi.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pb-10">
                    <Button asChild className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"><Link href="/">Quay lại trang chủ</Link></Button>
                    <Button variant="ghost" onClick={() => supabase.auth.signOut()} className="w-full text-white/40 hover:text-white hover:bg-white/5">Đăng xuất tài khoản</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function AdminAccountLocked() {
    const supabase = useSupabase();
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f0a] relative overflow-hidden font-body p-4">
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-destructive/10 rounded-full blur-[120px]" />

            <Card className="w-full max-w-md bg-white/5 border-white/5 backdrop-blur-xl text-white rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
                <CardHeader className="text-center pt-10">
                    <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-destructive animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl font-headline font-black italic uppercase tracking-tighter text-destructive">Tài khoản bị khóa</CardTitle>
                    <CardDescription className="text-white/40 uppercase text-[10px] font-bold tracking-widest mt-1">Tài khoản tạm thời ngưng hoạt động</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-white/60 leading-relaxed">
                        Tài khoản của bạn đã bị khóa bởi quản trị viên hệ thống. Mọi quyền truy cập vào Admin Hub đã bị đình chỉ tạm thời.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pb-10">
                    <Button asChild className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"><Link href="/">Về trang chủ</Link></Button>
                    <Button variant="ghost" onClick={() => supabase.auth.signOut()} className="w-full text-white/40 hover:text-white hover:bg-white/5">Đăng xuất</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function AdminPage() {
    const { user, loading: authLoading } = useUser();
    const supabase = useSupabase();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            if (!user) {
                setProfileLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error loading profile:', error);
                } else {
                    setUserProfile(data);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setProfileLoading(false);
            }
        }

        loadProfile();
    }, [user, supabase]);

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
