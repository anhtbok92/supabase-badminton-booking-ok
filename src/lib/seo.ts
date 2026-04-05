import type { Metadata } from 'next';
import { createClient } from '@/supabase/server';

export type SeoData = {
  page_slug: string;
  page_name: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  og_type: string;
  twitter_card: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image_url: string;
  canonical_url: string;
  robots: string;
  structured_data: Record<string, unknown>;
  custom_head_tags: string;
};

/**
 * Fetch SEO metadata from database for a given page slug.
 * Returns Next.js Metadata object ready to be exported from layout/page.
 */
export async function getSeoMetadata(
  pageSlug: string,
  fallback?: { title?: string; description?: string }
): Promise<Metadata> {
  try {
    const supabase = await createClient();
    
    // Fetch global settings
    const { data: globalData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'seo_global')
      .single();
    
    const global = (globalData?.value || {}) as any;

    const { data } = await supabase
      .from('seo_metadata')
      .select('*')
      .eq('page_slug', pageSlug)
      .single();

    const siteName = global.site_name || 'Sport Booking';

    if (!data) {
      return {
        title: fallback?.title ? `${fallback.title} | ${siteName}` : siteName,
        description: fallback?.description || '',
        verification: {
            google: global.google_site_verification || undefined,
        },
      };
    }

    const seo = data as SeoData;
    const metadata: Metadata = {
      title: seo.meta_title || fallback?.title || siteName,
      description: seo.meta_description || fallback?.description || '',
      verification: {
        google: global.google_site_verification || undefined,
      },
    };
    
    // Add site name suffix if not present
    if (metadata.title && typeof metadata.title === 'string' && !metadata.title.includes(siteName)) {
        metadata.title = `${metadata.title} | ${siteName}`;
    }

    if (seo.meta_keywords) {
      metadata.keywords = seo.meta_keywords.split(',').map(k => k.trim());
    }

    if (seo.robots) {
      metadata.robots = seo.robots;
    }

    if (seo.canonical_url) {
      metadata.alternates = { canonical: seo.canonical_url };
    }

    // Open Graph
    metadata.openGraph = {
      title: seo.og_title || seo.meta_title || undefined,
      description: seo.og_description || seo.meta_description || undefined,
      siteName: siteName,
      type: (seo.og_type as 'website' | 'article') || 'website',
      ...(seo.og_image_url ? { images: [{ url: seo.og_image_url, width: 1200, height: 630 }] } : {}),
    };
    
    if (global.fb_app_id) {
        metadata.other = {
            'fb:app_id': global.fb_app_id,
        };
    }

    // Twitter
    metadata.twitter = {
      card: (seo.twitter_card as 'summary' | 'summary_large_image') || 'summary_large_image',
      title: seo.twitter_title || seo.og_title || seo.meta_title || undefined,
      description: seo.twitter_description || seo.og_description || seo.meta_description || undefined,
      ...(seo.twitter_image_url || seo.og_image_url ? { images: [seo.twitter_image_url || seo.og_image_url] } : {}),
    };

    return metadata;
  } catch {
    return {
      title: fallback?.title || 'Sport Booking',
      description: fallback?.description || '',
    };
  }
}

/**
 * Get raw SEO data for custom rendering (e.g., structured data, custom head tags)
 */
export async function getRawSeoData(pageSlug: string): Promise<SeoData | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('seo_metadata')
      .select('*')
      .eq('page_slug', pageSlug)
      .single();
    return data as SeoData | null;
  } catch {
    return null;
  }
}
