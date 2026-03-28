'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabase, useSupabaseRow } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';

import type { NewsArticle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import NewsForm from '../../news-form';

function EditNewsPageSkeleton() {
  return (
    <div>
        <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-7 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    </div>
  )
}

export default function EditNewsPage() {
    const router = useRouter();
    const params = useParams();
    const articleId = params.id as string;

    const supabase = useSupabase();
    const { toast } = useToast();
    const { data: article, loading: articleLoading } = useSupabaseRow<NewsArticle>('news', articleId);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (values: any, bannerUrl: string) => {
        if (!articleId) return;
        setIsSubmitting(true);

        const articleData = {
            title: values.title,
            short_description: values.shortDescription,
            content_html: values.contentHtml,
            banner_image_url: bannerUrl,
            tags: values.tags || [],
        };

        try {
            const { error } = await supabase.from('news').update(articleData).eq('id', articleId);
            if (error) throw error;
            toast({ title: 'Thành công', description: 'Đã cập nhật bài viết.' });
            router.push('/admin');
            setTimeout(() => router.refresh(), 1000);
        } catch (error) {
            console.error(error);
            toast({ title: 'Lỗi', description: 'Không thể cập nhật bài viết.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (articleLoading) {
        return <EditNewsPageSkeleton />;
    }

    if (!article) {
        return <div>Không tìm thấy bài viết.</div>
    }

    // Map snake_case DB fields to camelCase for the form component
    const articleForForm = {
        ...article,
        shortDescription: article.short_description,
        contentHtml: article.content_html,
        bannerImageUrl: article.banner_image_url,
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" onClick={() => router.push('/admin')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold">Chỉnh sửa bài viết</h1>
                  <p className="text-sm text-muted-foreground truncate max-w-sm">{article.title}</p>
                </div>
            </div>
            <NewsForm article={articleForForm as any} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
    );
}
