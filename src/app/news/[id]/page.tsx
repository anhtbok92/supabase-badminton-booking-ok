'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSupabaseRow } from '@/supabase';
import type { NewsArticle } from '@/lib/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function NewsDetailSkeleton() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-40 w-full border-b bg-card">
                <div className="container mx-auto flex h-16 items-center px-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="ml-4 flex-grow"><Skeleton className="h-6 w-3/4" /></div>
                </div>
            </header>
            <main className="flex-grow">
                <Skeleton className="w-full aspect-video" />
                <div className="container mx-auto max-w-3xl px-4 py-8">
                    <Skeleton className="h-10 w-full mb-4" />
                    <Skeleton className="h-4 w-1/4 mb-8" />
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-5/6" />
                        <Skeleton className="h-5 w-full mt-4" />
                        <Skeleton className="h-5 w-2/3" />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function NewsDetailPage() {
    const params = useParams();
    const router = useRouter();
    const articleId = params.id as string;

    const { data: article, loading } = useSupabaseRow<NewsArticle>('news', articleId || null);
    
    if (loading) {
        return <NewsDetailSkeleton />;
    }

    if (!article) {
        return (
             <div className="flex flex-col min-h-screen">
                <header className="sticky top-0 z-40 w-full border-b bg-card">
                    <div className="container mx-auto flex h-16 items-center px-4">
                        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push('/news')}>
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-lg font-semibold font-headline truncate">Không tìm thấy</h1>
                    </div>
                </header>
                <main className="flex-grow flex items-center justify-center text-center">
                    <p>Không tìm thấy bài viết bạn yêu cầu.</p>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-40 w-full border-b bg-card">
                <div className="container mx-auto flex h-16 items-center px-4">
                    <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                        <span className="sr-only">Quay lại</span>
                    </Button>
                    <h1 className="text-lg font-semibold font-headline truncate">{article.title}</h1>
                </div>
            </header>

            <main className="flex-grow">
                <div className="relative w-full aspect-video bg-muted">
                    <Image 
                        src={article.banner_image_url}
                        alt={article.title}
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                    />
                </div>
                <article className="container mx-auto max-w-3xl px-4 py-8">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline mb-4">{article.title}</h1>
                    <p className="text-muted-foreground mb-8">
                        Đăng ngày {article.created_at ? format(new Date(article.created_at), 'dd MMMM, yyyy', { locale: vi }) : '...'}
                    </p>
                    <div 
                        className="prose prose-lg dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: article.content_html }} 
                    />
                </article>
            </main>
        </div>
    );
}
