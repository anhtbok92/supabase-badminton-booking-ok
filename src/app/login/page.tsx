'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useSupabase } from '@/supabase';
import { phoneToEmail } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { ChevronLeft } from 'lucide-react';

const authSchema = z.object({
  phone: z.string().regex(/^[0-9]{10,11}$/, { message: 'Số điện thoại phải có 10-11 chữ số.' }),
  password: z
    .string()
    .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' }),
});

type AuthFormValues = z.infer<typeof authSchema>;

function LoginForm() {
  const router = useRouter();
  const supabase = useSupabase();
  const { toast } = useToast();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = async (values: AuthFormValues) => {
    try {
      const email = phoneToEmail(values.phone);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });

      if (error) {
        let message = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
        if (error.message === 'Invalid login credentials') {
          message = 'Số điện thoại hoặc mật khẩu không chính xác.';
        }
        toast({
          title: 'Đăng nhập thất bại',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      toast({ title: 'Đăng nhập thành công!' });
      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Đăng nhập thất bại',
        description: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại</FormLabel>
              <FormControl>
                <Input placeholder="0912345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm() {
  const router = useRouter();
  const supabase = useSupabase();
  const { toast } = useToast();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = async (values: AuthFormValues) => {
    try {
      const email = phoneToEmail(values.phone);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: values.password,
      });

      if (error) {
        let message = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
        if (error.message?.includes('already registered')) {
          message = 'Số điện thoại này đã được sử dụng.';
        }
        toast({
          title: 'Đăng ký thất bại',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      // Insert user profile into users table
      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email: email,
          phone: values.phone,
          role: 'customer',
        });

        if (profileError) {
          console.error('Failed to create user profile:', profileError);
        }
      }

      toast({ title: 'Đăng ký thành công!' });
      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Đăng ký thất bại',
        description: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại</FormLabel>
              <FormControl>
                <Input placeholder="0912345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </Button>
      </form>
    </Form>
  );
}

export default function LoginPage() {
    const router = useRouter();
  return (
    <>
        <header className="sticky top-0 z-40 w-full border-b bg-card">
            <div className="container mx-auto flex h-16 items-center px-4">
                <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Quay lại</span>
                </Button>
                <h1 className="text-lg font-semibold font-headline truncate">Đăng nhập / Đăng ký</h1>
            </div>
        </header>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/40 p-4">
            <Tabs defaultValue="login" className="w-full max-w-sm">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                <TabsTrigger value="register">Đăng ký</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                <Card>
                    <CardHeader>
                    <CardTitle className="text-2xl font-headline">Chào mừng trở lại</CardTitle>
                    <CardDescription>
                        Nhập số điện thoại và mật khẩu của bạn để tiếp tục.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <LoginForm />
                    </CardContent>
                </Card>
                </TabsContent>
                <TabsContent value="register">
                <Card>
                    <CardHeader>
                    <CardTitle className="text-2xl font-headline">Tạo tài khoản</CardTitle>
                    <CardDescription>
                        Chỉ cần số điện thoại và mật khẩu để bắt đầu.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <RegisterForm />
                    </CardContent>
                </Card>
                </TabsContent>
            </Tabs>
        </div>
    </>
  );
}
