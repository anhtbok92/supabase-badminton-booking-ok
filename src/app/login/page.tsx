'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather, Phone, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react';

import { useSupabase } from '@/supabase';
import { phoneToEmail, phonToLegacyEmail } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const authSchema = z.object({
  phone: z.string().regex(/^[0-9]{10,11}$/, { message: 'Số điện thoại phải có 10-11 chữ số.' }),
  password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' }),
});

type AuthFormValues = z.infer<typeof authSchema>;

function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const supabase = useSupabase();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = async (values: AuthFormValues) => {
    try {
      const email = phoneToEmail(values.phone);

      if (mode === 'login') {
        // Try new domain first, fallback to legacy domain for old accounts
        let loginEmail = email;
        let { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: values.password });
        if (error && error.message === 'Invalid login credentials') {
          loginEmail = phonToLegacyEmail(values.phone);
          const retry = await supabase.auth.signInWithPassword({ email: loginEmail, password: values.password });
          error = retry.error;
        }
        if (error) {
          const message = error.message === 'Invalid login credentials'
            ? 'Số điện thoại hoặc mật khẩu không chính xác.'
            : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
          toast({ title: 'Đăng nhập thất bại', description: message, variant: 'destructive' });
          return;
        }
        toast({ title: 'Đăng nhập thành công!' });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: values.password });
        if (error) {
          const message = error.message?.includes('already registered')
            ? 'Số điện thoại này đã được sử dụng.'
            : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
          toast({ title: 'Đăng ký thất bại', description: message, variant: 'destructive' });
          return;
        }
        if (data.user) {
          await supabase.from('users').insert({ id: data.user.id, email, phone: values.phone, role: 'customer' });
        }
        toast({ title: 'Đăng ký thành công!' });
      }
      router.push('/');
    } catch {
      toast({ title: 'Lỗi', description: 'Đã có lỗi xảy ra.', variant: 'destructive' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Số điện thoại</FormLabel>
            <FormControl>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="0912345678" className="pl-10 h-12 rounded-xl bg-white border-gray-200" {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Mật khẩu</FormLabel>
            <FormControl>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10 pr-10 h-12 rounded-xl bg-white border-gray-200"
                  {...field}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full h-12 rounded-xl text-white font-bold text-base shadow-lg shadow-primary/30" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? (mode === 'login' ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...')
            : (mode === 'login' ? 'Đăng nhập' : 'Đăng ký')}
        </Button>
      </form>
    </Form>
  );
}

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-bold font-headline">Đăng nhập / Đăng ký</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-12">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Feather className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold font-headline text-center">Sport Booking</h2>
          <p className="text-sm text-muted-foreground mt-1 text-center">Đặt sân thể thao nhanh chóng và tiện lợi</p>
        </div>

        <div className="w-full max-w-sm">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl bg-gray-100 p-1">
              <TabsTrigger value="login" className="rounded-lg text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Đăng nhập</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Đăng ký</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <AuthForm mode="login" />
            </TabsContent>
            <TabsContent value="register" className="mt-6">
              <AuthForm mode="register" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
