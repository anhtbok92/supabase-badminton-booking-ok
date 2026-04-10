import { MetadataRoute } from 'next';
import { createClient } from '@/supabase/server';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = 'https://sportbooking.online';

  // Static pages from metadata table
  const { data: pages } = await supabase
    .from('seo_metadata')
    .select('page_slug, updated_at');
  
  const staticPages = (pages || []).map(page => ({
    url: `${baseUrl}${page.page_slug === 'landing' ? '' : `/${page.page_slug}`}`,
    lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: page.page_slug === 'landing' ? 1 : 0.8,
  }));

  // Dynamic content e.g. news
  const { data: news } = await supabase
    .from('news_articles')
    .select('id, updated_at')
    .limit(100);

  const newsPages = (news || []).map(article => ({
    url: `${baseUrl}/news/${article.id}`,
    lastModified: article.updated_at ? new Date(article.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // SEO club detail pages
  const { data: clubs } = await supabase
    .from('clubs')
    .select('slug, created_at')
    .eq('is_active', true)
    .not('slug', 'is', null);

  const clubPages = (clubs || []).map(club => ({
    url: `${baseUrl}/san/${club.slug}`,
    lastModified: club.created_at ? new Date(club.created_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // SEO listing pages
  const { data: seoPages } = await supabase
    .from('seo_landing_pages')
    .select('slug, updated_at')
    .eq('is_active', true);

  const seoListingPages = (seoPages || []).map(page => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...newsPages,
    ...clubPages,
    ...seoListingPages,
  ];
}
