'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useSupabaseQuery } from '@/supabase';
import type { NewsArticle, NewsTag } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Newspaper, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// New component for the horizontal featured card
function FeaturedNewsCard({ article }: { article: NewsArticle }) {
    return (
        <Link href={`/news/${article.id}`} className="block group w-72 flex-shrink-0">
            <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl h-full flex flex-col">
                <CardHeader className="p-0">
                    <div className="relative aspect-video w-full">
                        <Image
                            src={article.banner_image_url}
                            alt={article.title}
                            fill
                            className="object-cover"
                            sizes="70vw"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-3 flex flex-col flex-grow">
                    <h3 className="font-headline font-semibold text-base leading-tight group-hover:text-primary transition-colors truncate block w-full pr-2">
                        {article.title}
                    </h3>
                    <div
                        className="text-xs text-muted-foreground mt-2 overflow-hidden pr-4"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.25rem',
                            maxHeight: '2.56rem'
                        }}
                        dangerouslySetInnerHTML={{ __html: article.short_description }}
                    />
                    <p className="text-[10px] text-muted-foreground/60 mt-auto pt-2">
                        {article.created_at ? format(new Date(article.created_at), 'dd MMMM, yyyy', { locale: vi }) : '...'}
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
}

// New component for the vertical list item card
function LatestNewsCard({ article }: { article: NewsArticle }) {
    return (
        <Link href={`/news/${article.id}`} className="block group">
            <Card className="flex gap-4 p-3 transition-shadow duration-300 hover:shadow-lg h-full">
                <div className="relative w-28 h-28 shrink-0 rounded-lg overflow-hidden bg-muted">
                    <Image
                        src={article.banner_image_url}
                        alt={article.title}
                        fill
                        className="object-cover"
                        sizes="25vw"
                    />
                </div>
                <div className="flex flex-col justify-center gap-1 min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                        {article.tags?.map(tag => (
                            <span key={tag} className="text-primary text-[10px] font-bold uppercase">{tag}</span>
                        ))}
                    </div>
                    <h4 className="font-headline font-semibold text-sm leading-tight group-hover:text-primary transition-colors truncate block w-full pr-2">
                        {article.title}
                    </h4>
                    <div
                        className="text-[11px] text-muted-foreground mt-1 overflow-hidden pr-4"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.1rem',
                            maxHeight: '2.25rem'
                        }}
                        dangerouslySetInnerHTML={{ __html: article.short_description }}
                    />
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {article.created_at ? format(new Date(article.created_at), 'dd MMMM, yyyy', { locale: vi }) : '...'}
                    </p>
                </div>
            </Card>
        </Link>
    );
}

// Skeletons for the new layout
function NewsPageSkeleton() {
    return (
        <div className="container mx-auto px-0 py-4 pb-24">
            <div className="px-4"><Skeleton className="h-8 w-40 mb-4" /></div>
            <div className="pl-4 pb-4">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-3">
                        <Skeleton className="h-9 w-20 rounded-full" />
                        <Skeleton className="h-9 w-24 rounded-full" />
                        <Skeleton className="h-9 w-32 rounded-full" />
                        <Skeleton className="h-9 w-28 rounded-full" />
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            <div className="px-4 mt-6">
                <Skeleton className="h-7 w-48 mb-4" />
                <div className="pl-0">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex gap-4 pb-2">
                            <div className="w-72 flex-shrink-0">
                                <Skeleton className="aspect-video w-full rounded-xl" />
                                <Skeleton className="h-5 w-full mt-3" />
                                <Skeleton className="h-5 w-5/6 mt-1" />
                                <Skeleton className="h-4 w-1/3 mt-2" />
                            </div>
                            <div className="w-72 flex-shrink-0">
                                <Skeleton className="aspect-video w-full rounded-xl" />
                                <Skeleton className="h-5 w-full mt-3" />
                                <Skeleton className="h-5 w-5/6 mt-1" />
                                <Skeleton className="h-4 w-1/3 mt-2" />
                            </div>
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>

            <div className="px-4 mt-8">
                <Skeleton className="h-7 w-32 mb-4" />
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-4 p-3 rounded-xl border">
                            <Skeleton className="w-24 h-24 rounded-lg" />
                            <div className="flex-1 space-y-2 py-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-5/6" />
                                <Skeleton className="h-4 w-1/3 mt-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function NewsPage() {
    const [activeTag, setActiveTag] = useState('Tất cả');

    const { data: articles, loading: articlesLoading } = useSupabaseQuery<NewsArticle>(
        'news',
        (q) => q.order('created_at', { ascending: false })
    );
    const { data: tags, loading: tagsLoading } = useSupabaseQuery<NewsTag>('news_tags');

    const loading = articlesLoading || tagsLoading;

    const filteredArticles = useMemo(() => {
        if (!articles) return [];
        if (activeTag === 'Tất cả') return articles;
        return articles.filter(article => article.tags?.includes(activeTag));
    }, [articles, activeTag]);

    const featuredArticles = filteredArticles?.slice(0, 3) || [];
    const latestArticles = filteredArticles?.slice(3) || [];

    if (loading) {
        return <NewsPageSkeleton />;
    }

    return (
        <div className="container mx-auto px-0 pt-4 pb-24">
            <div className="px-4 mb-4 flex justify-between items-center">
                <h1 className="text-3xl font-bold font-headline">
                    Tin tức
                </h1>
                <Button variant="ghost" size="icon">
                    <Search className="h-6 w-6" />
                </Button>
            </div>

            <div className="pl-4 pb-4">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-3">
                        <Button
                            className="shrink-0 rounded-full h-9 px-5 shadow-sm"
                            variant={activeTag === 'Tất cả' ? 'default' : 'outline'}
                            onClick={() => setActiveTag('Tất cả')}
                            size="sm"
                        >
                            Tất cả
                        </Button>
                        {tags?.map(tag => (
                            <Button
                                key={tag.id}
                                className="shrink-0 rounded-full h-9 px-5 bg-card"
                                variant={activeTag === tag.name ? 'default' : 'outline'}
                                onClick={() => setActiveTag(tag.name)}
                                size="sm"
                            >
                                {tag.name}
                            </Button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {!filteredArticles || filteredArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-lg mx-4 mt-8">
                    <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">Chưa có tin tức phù hợp</h2>
                    <p className="mt-2 text-muted-foreground">
                        {activeTag === 'Tất cả' ? 'Các bài viết mới sẽ sớm được cập nhật tại đây.' : `Không có bài viết nào với tag "${activeTag}".`}
                    </p>
                </div>
            ) : (
                <>
                    {featuredArticles.length > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between px-4 mb-3">
                                <h3 className="text-xl font-bold font-headline">Tin nổi bật</h3>
                                <Link href="#" className="text-primary text-sm font-semibold">Xem tất cả</Link>
                            </div>
                            <div className="pl-4">
                                <ScrollArea className="w-full whitespace-nowrap">
                                    <div className="flex gap-4 pb-2">
                                        {featuredArticles.map(article => <FeaturedNewsCard key={article.id} article={article} />)}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    {latestArticles.length > 0 && (
                        <div className="mt-8">
                            <div className="px-4 mb-3">
                                <h3 className="text-xl font-bold font-headline">Mới nhất</h3>
                            </div>
                            <div className="space-y-4 px-4">
                                {latestArticles.map(article => <LatestNewsCard key={article.id} article={article} />)}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
