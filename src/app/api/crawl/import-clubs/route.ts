import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

type ImportPlace = {
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  rating: number;
  photo_urls: string[];
  operating_hours: string;
  club_type: string;
  city: string;
  district: string;
  description: string;
  open_time: string;
  close_time: string;
  number_of_courts?: number;
};

/**
 * POST /api/crawl/import-clubs
 * Import selected places as clubs into the database
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { places } = await request.json() as { places: ImportPlace[] };
  if (!places || places.length === 0) {
    return NextResponse.json({ error: 'Không có sân nào để import' }, { status: 400 });
  }

  const results: { name: string; success: boolean; error?: string }[] = [];

  for (const place of places) {
    // Default pricing if not provided
    const defaultPricing = {
      weekday: [
        { timeRange: ['05:00', '17:00'], price: 30000, is_priority: false },
        { timeRange: ['17:00', '22:00'], price: 40000, is_priority: false },
      ],
      weekend: [
        { timeRange: ['05:00', '22:00'], price: 40000, is_priority: false },
      ],
    };

    const clubData = {
      name: place.name,
      address: place.address,
      phone: place.phone || '',
      latitude: place.latitude,
      longitude: place.longitude,
      rating: place.rating || 0,
      image_urls: place.photo_urls || [],
      pricing: defaultPricing,
      operating_hours: place.operating_hours || '',
      club_type: place.club_type,
      is_active: true,
      city: place.city || null,
      district: place.district || null,
      description: place.description || `${place.name} - Sân ${place.club_type} tại ${place.address}`,
      open_time: place.open_time || '05:00',
      close_time: place.close_time || '22:00',
      number_of_courts: place.number_of_courts || 5,
    };

    // Check duplicate by name
    const { data: existing } = await supabase
      .from('clubs')
      .select('id')
      .eq('name', place.name)
      .limit(1);

    if (existing && existing.length > 0) {
      results.push({ name: place.name, success: false, error: 'Đã tồn tại' });
      continue;
    }

    const { data: inserted, error } = await supabase.from('clubs').insert(clubData).select('id').single();
    if (error || !inserted) {
      results.push({ name: place.name, success: false, error: error?.message || 'Insert failed' });
    } else {
      // Create default courts
      const numCourts = place.number_of_courts || 5;
      const courts = Array.from({ length: numCourts }, (_, i) => ({
        club_id: inserted.id,
        name: `Sân ${i + 1}`,
        order: i + 1,
      }));
      await supabase.from('courts').insert(courts);
      results.push({ name: place.name, success: true });
    }
  }

  // Auto-regenerate SEO pages
  const { generateSeoPages } = await import('@/lib/seo-generator');
  await generateSeoPages(supabase).catch(() => {});

  const imported = results.filter(r => r.success).length;
  return NextResponse.json({ results, imported, total: places.length });
}
