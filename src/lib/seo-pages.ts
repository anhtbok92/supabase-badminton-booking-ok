import { createStaticClient } from '@/supabase/server';
import type { Club } from '@/lib/types';

export type SeoLandingPage = {
  id: string;
  slug: string;
  page_type: 'type_city' | 'type_district' | 'near_location' | 'price' | 'amenity' | 'time';
  title: string;
  meta_description: string | null;
  h1_title: string;
  seo_content: string | null;
  filter_params: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Create a supabase client safe for both request and build-time contexts */
function getClient() {
  return createStaticClient();
}

/** Fetch a single SEO landing page config by slug */
export async function getSeoLandingPage(slug: string): Promise<SeoLandingPage | null> {
  const supabase = getClient();
  const { data } = await supabase
    .from('seo_landing_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  return data as SeoLandingPage | null;
}

/** Fetch all active SEO landing pages (for generateStaticParams) */
export async function getAllSeoLandingPages(): Promise<SeoLandingPage[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('seo_landing_pages')
    .select('*')
    .eq('is_active', true);
  return (data || []) as SeoLandingPage[];
}

/** Fetch clubs based on SEO page filter params */
export async function getClubsByFilter(params: Record<string, any>): Promise<Club[]> {
  const supabase = getClient();

  // Near location: use RPC function
  if (params.lat && params.lng) {
    const { data } = await supabase.rpc('nearby_clubs', {
      lat: params.lat,
      lng: params.lng,
      radius_km: params.radius_km || 5,
      sport_type: params.club_type || null,
    });
    return (data || []) as Club[];
  }

  // Standard query
  let query = supabase
    .from('clubs')
    .select('*')
    .eq('is_active', true);

  if (params.club_type) query = query.eq('club_type', params.club_type);
  if (params.city) query = query.eq('city', params.city);
  if (params.district) query = query.eq('district', params.district);

  if (params.amenity) {
    const amenity = params.amenity;
    if (amenity === 'has_roof') query = query.eq('has_roof', true);
    if (amenity === 'indoor') query = query.eq('indoor_outdoor', 'indoor');
    if (amenity === 'outdoor') query = query.eq('indoor_outdoor', 'outdoor');
    if (amenity === 'has_lighting') query = query.eq('has_lighting', true);
    if (amenity === 'has_parking') query = query.eq('has_parking', true);
  }

  if (params.time_filter === '24h') {
    query = query.eq('open_time', '00:00').eq('close_time', '23:59');
  }

  const { data } = await query.order('name');
  let clubs = (data || []) as Club[];

  // JS-side filtering for complex conditions
  if (params.max_price) {
    clubs = clubs.filter(club => {
      if (!club.pricing?.weekday?.length) return false;
      const minPrice = Math.min(...club.pricing.weekday.map(p => p.price));
      return minPrice <= params.max_price;
    });
  }
  if (params.time_filter === 'night') {
    clubs = clubs.filter(club => {
      const closeTime = (club as any).close_time;
      if (!closeTime) return false;
      return closeTime >= '21:00' || closeTime === '00:00';
    });
  }

  return clubs;
}

/** Fetch a single club by slug for detail page */
export async function getClubBySlug(slug: string): Promise<Club | null> {
  const supabase = getClient();
  const { data } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  return data as Club | null;
}

/** Fetch all active clubs (for generateStaticParams) */
export async function getAllClubSlugs(): Promise<string[]> {
  const supabase = getClient();
  const { data } = await supabase
    .from('clubs')
    .select('slug')
    .eq('is_active', true)
    .not('slug', 'is', null);
  return (data || []).map((c: any) => c.slug).filter(Boolean);
}

/** Get min price from club pricing */
export function getMinPrice(pricing: Club['pricing']): number | null {
  if (!pricing) return null;
  const allPrices = [
    ...(pricing.weekday || []).map(p => p.price),
    ...(pricing.weekend || []).map(p => p.price),
  ].filter(p => p > 0);
  return allPrices.length > 0 ? Math.min(...allPrices) : null;
}

/** Format price to Vietnamese format */
export function formatVNPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price);
}
