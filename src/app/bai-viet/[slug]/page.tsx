import { createClient } from '@/supabase/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, seo_title, seo_description, short_description, banner_image_url, seo_keywords')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) return { title: 'Không tìm thấy bài viết' };

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.short_description,
    keywords: post.seo_keywords?.join(', '),
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.short_description,
      images: post.banner_image_url ? [post.banner_image_url] : [],
      type: 'article',
    },
  };
}

export const revalidate = 60;

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) notFound();

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo_description || post.short_description,
    image: post.banner_image_url,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Organization', name: 'Sport Booking' },
    publisher: { '@type': 'Organization', name: 'Sport Booking' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Button variant="ghost" size="icon" className="mr-2" asChild>
              <Link href="/bai-viet"><ChevronLeft className="h-6 w-6" /></Link>
            </Button>
            <h1 className="text-sm font-medium truncate flex-1">{post.title}</h1>
          </div>
        </header>

        {post.banner_image_url && (
          <div className="w-full max-h-[400px] overflow-hidden">
            <img
              src={post.banner_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <main className="container mx-auto max-w-3xl px-4 py-8">
          <article>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at), "dd 'tháng' MM, yyyy", { locale: vi })}
                </span>
              )}
            </div>

            {post.short_description && (
              <p className="text-lg text-muted-foreground mb-8 border-l-4 border-primary pl-4 italic">
                {post.short_description}
              </p>
            )}

            <div
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:leading-relaxed prose-p:mb-4
                prose-li:leading-relaxed
                prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: post.content_html }}
            />

            {post.seo_keywords && post.seo_keywords.length > 0 && (
              <div className="mt-10 pt-6 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.seo_keywords.map((kw: string) => (
                    <span key={kw} className="text-sm bg-muted px-3 py-1 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </article>

          <div className="mt-10 pt-6 border-t text-center">
            <Link href="/bai-viet" className="text-primary hover:underline text-sm font-medium">
              ← Xem tất cả bài viết
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
