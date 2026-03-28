'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Image from 'next/image';

import type { NewsArticle, NewsTag } from '@/lib/types';
import { useSupabaseQuery, useSupabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, Trash2, Zap, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/upload';
import RichTextEditor from '@/components/ui/rich-text-editor';

const newsFormSchema = z.object({
    title: z.string().min(1, 'Tiêu đề không được để trống'),
    shortDescription: z.string().min(1, 'Mô tả ngắn không được để trống'),
    contentHtml: z.string().min(1, 'Nội dung không được để trống'),
    tags: z.array(z.string()).optional(),
});

type NewsFormSchema = z.infer<typeof newsFormSchema>;

interface NewsFormProps {
    article?: NewsArticle;
    onSubmit: (values: NewsFormSchema, bannerUrl: string) => Promise<void>;
    isSubmitting: boolean;
}

export default function NewsForm({ article, onSubmit, isSubmitting }: NewsFormProps) {
    const { toast } = useToast();
    const supabase = useSupabase();
    const { data: availableTags, loading: tagsLoading } = useSupabaseQuery<NewsTag>('news_tags');

    const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(article?.banner_image_url || null);
    const [isUploading, setIsUploading] = useState(false);
    const [crawlUrl, setCrawlUrl] = useState('');
    const [isCrawling, setIsCrawling] = useState(false);

    const handleCrawl = async () => {
        if (!crawlUrl) return;
        setIsCrawling(true);
        try {
            const response = await fetch('/api/crawl', {
                method: 'POST',
                body: JSON.stringify({ url: crawlUrl }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            form.setValue('title', data.title);
            form.setValue('shortDescription', data.shortDescription);
            form.setValue('contentHtml', data.contentHtml);
            if (data.bannerImageUrl) {
                setBannerImageUrl(data.bannerImageUrl);
            }
            toast({ title: 'Thành công', description: 'Đã crawl dữ liệu thành công.' });
        } catch (error: any) {
            console.error("Crawl failed:", error);
            toast({ title: 'Lỗi Crawler', description: error.toString(), variant: 'destructive' });
        } finally {
            setIsCrawling(false);
        }
    };

    const form = useForm<NewsFormSchema>({
        resolver: zodResolver(newsFormSchema),
        defaultValues: {
            title: article?.title ?? '',
            shortDescription: article?.short_description ?? '',
            contentHtml: article?.content_html ?? '',
            tags: article?.tags ?? [],
        },
    });

    const handleImageUpload = async (file: File | null) => {
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadFile(supabase, 'news', file);
            setBannerImageUrl(url);
        } catch (error) {
            console.error("Upload failed:", error);
            toast({ title: "Lỗi tải lên", description: `Không thể tải lên ảnh.`, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleFormSubmit = (values: NewsFormSchema) => {
        if (!bannerImageUrl) {
            toast({ title: 'Lỗi', description: 'Vui lòng tải lên một ảnh banner.', variant: 'destructive' });
            return;
        }
        onSubmit(values, bannerImageUrl);
    }

    const formIsSubmitting = form.formState.isSubmitting || isSubmitting || isUploading;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                Crawler bài viết nhanh
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Dán link bài báo hoặc blog cầu lông để tự động lấy nội dung.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://..."
                                    value={crawlUrl}
                                    onChange={(e) => setCrawlUrl(e.target.value)}
                                    disabled={isCrawling}
                                    className="bg-background"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCrawl}
                                    disabled={isCrawling || !crawlUrl}
                                >
                                    {isCrawling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crawler'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Nội dung bài viết</CardTitle>
                            <CardDescription>Nhập tiêu đề, mô tả và nội dung chi tiết cho bài viết của bạn.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input placeholder="Nhập tiêu đề hấp dẫn..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="shortDescription" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mô tả ngắn</FormLabel>
                                    <FormControl>
                                        <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Tóm tắt ngắn gọn nội dung bài viết..." />
                                    </FormControl>
                                    <FormDescription>Phần này sẽ hiển thị ở danh sách bài viết bên ngoài.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="contentHtml" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nội dung chi tiết</FormLabel>
                                    <FormControl>
                                        <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Viết nội dung bài viết đầy đủ tại đây..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Xuất bản</CardTitle></CardHeader>
                        <CardContent>
                            <Button type="submit" className="w-full" disabled={formIsSubmitting}>
                                {formIsSubmitting ? 'Đang lưu...' : (article ? 'Lưu thay đổi' : 'Đăng bài viết')}
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Ảnh Banner</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {bannerImageUrl ? (
                                <div className="relative group">
                                    <Image src={bannerImageUrl} alt="Banner" width={400} height={200} className="w-full aspect-video object-cover rounded-md bg-muted" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button type="button" size="sm" variant="destructive" onClick={() => setBannerImageUrl(null)}>Xóa ảnh</Button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary">
                                    {isUploading ? (<p>Đang tải lên...</p>) : (
                                        <>
                                            <UploadCloud className="w-8 h-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground mt-2">Nhấn để tải ảnh</p>
                                        </>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} disabled={isUploading} />
                                </label>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="tags"
                                render={() => (
                                    <FormItem>
                                        <div className="space-y-2">
                                            {tagsLoading && <Skeleton className='h-5 w-24' />}
                                            {availableTags?.map((tag) => (
                                                <FormField
                                                    key={tag.id}
                                                    control={form.control}
                                                    name="tags"
                                                    render={({ field }) => (
                                                        <FormItem key={tag.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(tag.name)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...(field.value || []), tag.name])
                                                                            : field.onChange(field.value?.filter((value) => value !== tag.name));
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">{tag.name}</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>
            </form>
        </Form>
    );
}
