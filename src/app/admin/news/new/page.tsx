'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NewsForm from '../news-form';

export default function NewNewsPage() {
    const router = useRouter();
    const supabase = useSupabase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (values: any, bannerUrl: string) => {
        setIsSubmitting(true);

        const articleData = {
            title: values.title,
            short_description: values.shortDescription,
            content_html: values.contentHtml,
            banner_image_url: bannerUrl,
            tags: values.tags || [],
        };

        try {
            const { error } = await supabase.from('news').insert(articleData);
            if (error) throw error;
            toast({ title: 'Thành công', description: 'Đã tạo bài viết mới.' });
            router.push('/admin');
            setTimeout(() => router.refresh(), 1000);
        } catch (error) {
            console.error(error);
            toast({ title: 'Lỗi', description: 'Không thể tạo bài viết.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" onClick={() => router.push('/admin')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-bold">Tạo bài viết mới</h1>
            </div>
            <NewsForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
    );
}
