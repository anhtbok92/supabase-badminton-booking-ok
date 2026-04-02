import { createClient } from '@/supabase/server';
import type { BlogPost } from '@/lib/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Bài viết - Sport Booking',
  description: 'Tin tức, hướng dẫn đặt sân thể thao, mẹo chơi cầu lông và các bài viết hữu ích từ Sport Booking.',
  openGraph: {
    title: 'Bài viết - Sport Booking',
    description: 'Tin tức, hướng dẫn đặt sân thể thao, mẹo chơi cầu lông và các bài viết hữu ích.',
  },
};

export const revalidate = 60; // ISR: revalidate every 60s

export default async function BlogListPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, short_description, banner_image_url, published_at, seo_keywords')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" className="mr-2" asChild>
            <Link href="/"><ChevronLeft className="h-6 w-6" /></Link>
          </Button>
          <h1 className="text-lg font-semibold">Bài viết</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Blog & Tin tức</h2>
          <p className="text-muted-foreground">Hướng dẫn, mẹo hay và tin tức mới nhất về thể thao.</p>
        </div>

        {(!posts || posts.length === 0) ? (
          <p className="text-center text-muted-foreground py-16">Chưa có bài viết nào.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post: BlogPost) => (
              <Link
                key={post.id}
                href={`/bai-viet/${post.slug}`}
                className="group block rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all"
              >
                {post.banner_image_url && (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={post.banner_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {post.short_description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {post.published_at && format(new Date(post.published_at), 'dd/MM/yyyy', { locale: vi })}
                  </div>
                  {post.seo_keywords && post.seo_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.seo_keywords.slice(0, 3).map((kw: string) => (
                        <span key={kw} className="text-xs bg-muted px-2 py-0.5 rounded-full">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
