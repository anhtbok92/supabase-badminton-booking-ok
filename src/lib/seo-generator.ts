import { SupabaseClient } from '@supabase/supabase-js';
import { PROVINCES } from '@/lib/vietnam-locations';

type SeoPageInsert = {
  slug: string;
  page_type: string;
  title: string;
  meta_description: string;
  h1_title: string;
  seo_content: string;
  filter_params: Record<string, any>;
};

/** Generate all SEO landing pages based on actual club data in DB */
export async function generateSeoPages(supabase: SupabaseClient): Promise<{
  generated: number;
  removed: number;
  errors: string[];
}> {
  const errors: string[] = [];

  // 1. Fetch active clubs
  const { data: clubs, error: clubsErr } = await supabase
    .from('clubs')
    .select('id, club_type, city, district, open_time, close_time')
    .eq('is_active', true);

  if (clubsErr || !clubs) {
    return { generated: 0, removed: 0, errors: [`Failed to fetch clubs: ${clubsErr?.message}`] };
  }

  // 2. Fetch amenity types from DB
  const { data: amenityTypes } = await supabase
    .from('amenity_types')
    .select('id, name, slug')
    .order('order');
  const amenityMap = new Map((amenityTypes || []).map(a => [a.id, a]));

  // 3. Fetch club_amenities junction
  const { data: clubAmenities } = await supabase
    .from('club_amenities')
    .select('club_id, amenity_type_id');

  // Build club → amenity slugs map
  const clubAmenityMap = new Map<string, string[]>();
  for (const ca of clubAmenities || []) {
    const amenity = amenityMap.get(ca.amenity_type_id);
    if (!amenity) continue;
    const list = clubAmenityMap.get(ca.club_id) || [];
    list.push(amenity.slug);
    clubAmenityMap.set(ca.club_id, list);
  }

  // Helpers
  const getCityName = (s: string) => PROVINCES.find(p => p.slug === s)?.name || s;
  const getDistrictName = (c: string, d: string) => {
    const prov = PROVINCES.find(p => p.slug === c);
    return prov?.districts.find(dd => dd.slug === d)?.name || d;
  };

  // 4. Collect unique combinations
  const typeCityCombos = new Set<string>();
  const typeDistrictCombos = new Set<string>();
  const amenityCombos = new Set<string>(); // type|amenitySlug|city
  const timeCombos = new Set<string>();

  for (const club of clubs) {
    if (!club.club_type) continue;
    const type = club.club_type;

    if (club.city) {
      typeCityCombos.add(`${type}|${club.city}`);
    }
    if (club.city && club.district) {
      typeDistrictCombos.add(`${type}|${club.city}|${club.district}`);
    }
    // Dynamic amenities
    const clubAmenSlugs = clubAmenityMap.get(club.id) || [];
    if (club.city) {
      for (const amenSlug of clubAmenSlugs) {
        amenityCombos.add(`${type}|${amenSlug}|${club.city}`);
      }
    }
    // Time
    if (club.city && club.close_time) {
      if (club.close_time >= '21:00' || club.close_time === '00:00') {
        timeCombos.add(`${type}|night|${club.city}`);
      }
    }
  }

  // Amenity slug → name map for labels
  const amenityNameMap = new Map<string, string>();
  for (const a of amenityTypes || []) {
    amenityNameMap.set(a.slug, a.name);
  }

  const pages: SeoPageInsert[] = [];

  // --- Type + City ---
  for (const combo of typeCityCombos) {
    const [type, city] = combo.split('|');
    const cityName = getCityName(city);
    const ts = slugify(type);
    pages.push({
      slug: `san-${ts}-${city}`,
      page_type: 'type_city',
      title: `Sân ${type} ${cityName} - Đặt sân online | Sport Booking`,
      meta_description: `Danh sách sân ${type} tại ${cityName}. Đặt sân online nhanh chóng, giá tốt nhất.`,
      h1_title: `Sân ${type} tại ${cityName}`,
      seo_content: buildSeoContent('type_city', type, cityName),
      filter_params: { club_type: type, city, city_name: cityName },
    });
    // Price page
    pages.push({
      slug: `san-${ts}-gia-re-${city}`,
      page_type: 'price',
      title: `Sân ${type} giá rẻ ${cityName} - Dưới 200k/giờ | Sport Booking`,
      meta_description: `Danh sách sân ${type} giá rẻ tại ${cityName}, giá dưới 200.000đ/giờ.`,
      h1_title: `Sân ${type} giá rẻ tại ${cityName}`,
      seo_content: buildSeoContent('price', type, cityName),
      filter_params: { club_type: type, max_price: 200000, city, city_name: cityName },
    });
  }

  // --- Type + District ---
  for (const combo of typeDistrictCombos) {
    const [type, city, district] = combo.split('|');
    const districtName = getDistrictName(city, district);
    const cityName = getCityName(city);
    pages.push({
      slug: `san-${slugify(type)}-${district}`,
      page_type: 'type_district',
      title: `Sân ${type} ${districtName} - Đặt sân online | Sport Booking`,
      meta_description: `Danh sách sân ${type} tại ${districtName}, ${cityName}.`,
      h1_title: `Sân ${type} tại ${districtName}`,
      seo_content: buildSeoContent('type_district', type, districtName, cityName),
      filter_params: { club_type: type, district, district_name: districtName, city, city_name: cityName },
    });
  }

  // --- Amenity (dynamic) ---
  for (const combo of amenityCombos) {
    const [type, amenSlug, city] = combo.split('|');
    const cityName = getCityName(city);
    const amenName = amenityNameMap.get(amenSlug) || amenSlug;
    pages.push({
      slug: `san-${slugify(type)}-${amenSlug}-${city}`,
      page_type: 'amenity',
      title: `Sân ${type} ${amenName.toLowerCase()} ${cityName} | Sport Booking`,
      meta_description: `Danh sách sân ${type} ${amenName.toLowerCase()} tại ${cityName}.`,
      h1_title: `Sân ${type} ${amenName.toLowerCase()} tại ${cityName}`,
      seo_content: buildSeoContent('amenity', type, cityName, amenName.toLowerCase()),
      filter_params: { club_type: type, amenity_slug: amenSlug, city, city_name: cityName },
    });
  }

  // --- Time ---
  for (const combo of timeCombos) {
    const [type, timeFilter, city] = combo.split('|');
    const cityName = getCityName(city);
    const timeLabel = timeFilter === 'night' ? 'mở đêm' : 'mở 24h';
    pages.push({
      slug: `san-${slugify(type)}-${timeFilter === 'night' ? 'mo-dem' : 'mo-24h'}-${city}`,
      page_type: 'time',
      title: `Sân ${type} ${timeLabel} ${cityName} | Sport Booking`,
      meta_description: `Danh sách sân ${type} ${timeLabel} tại ${cityName}.`,
      h1_title: `Sân ${type} ${timeLabel} tại ${cityName}`,
      seo_content: buildSeoContent('time', type, cityName, timeLabel),
      filter_params: { club_type: type, time_filter: timeFilter, city, city_name: cityName },
    });
  }

  // 5. Multiply pages with active prefix/suffix modifiers
  const { data: modifiers } = await supabase
    .from('seo_modifiers')
    .select('type, label, slug')
    .eq('is_active', true);

  const basePages = [...pages];
  for (const mod of modifiers || []) {
    for (const base of basePages) {
      const modSlug = mod.type === 'prefix'
        ? `${mod.slug}-${base.slug}`
        : `${base.slug}-${mod.slug}`;
      const modTitle = mod.type === 'prefix'
        ? base.title.replace(/^Sân/, `${mod.label} sân`)
        : `${base.title.replace(/ \| Sport Booking$/, '')} ${mod.label} | Sport Booking`;
      const modH1 = mod.type === 'prefix'
        ? base.h1_title.replace(/^Sân/, `${mod.label} sân`)
        : `${base.h1_title} ${mod.label}`;

      pages.push({
        slug: modSlug,
        page_type: base.page_type,
        title: modTitle,
        meta_description: base.meta_description.replace(/^Danh sách sân/, mod.type === 'prefix' ? `Danh sách ${mod.label.toLowerCase()} sân` : `Danh sách sân`),
        h1_title: modH1,
        seo_content: base.seo_content,
        filter_params: base.filter_params,
      });
    }
  }

  // 6. Upsert all pages
  let generated = 0;
  for (const page of pages) {
    const { error } = await supabase
      .from('seo_landing_pages')
      .upsert(page, { onConflict: 'slug' });
    if (error) {
      errors.push(`Failed to upsert ${page.slug}: ${error.message}`);
    } else {
      generated++;
    }
  }

  // 7. Deactivate pages that no longer have matching clubs
  const validSlugs = pages.map(p => p.slug);
  const { data: existingPages } = await supabase
    .from('seo_landing_pages')
    .select('slug')
    .eq('is_active', true);

  let removed = 0;
  if (existingPages) {
    const toRemove = existingPages
      .filter(p => !validSlugs.includes(p.slug))
      .map(p => p.slug);
    if (toRemove.length > 0) {
      const { error } = await supabase
        .from('seo_landing_pages')
        .update({ is_active: false })
        .in('slug', toRemove);
      if (!error) removed = toRemove.length;
    }
  }

  return { generated, removed, errors };
}

// --- Helpers ---

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildSeoContent(pageType: string, sportType: string, location: string, extra?: string): string {
  const s = sportType.toLowerCase();
  switch (pageType) {
    case 'type_city':
      return `<p>${location} là một trong những khu vực có phong trào ${s} phát triển mạnh. Với nhiều sân từ cơ bản đến chuyên nghiệp, người chơi có thể dễ dàng tìm được sân phù hợp.</p>`
        + `<p>Sport Booking giúp bạn tìm và đặt sân ${s} tại ${location} nhanh chóng và tiện lợi. Hệ thống hiển thị thông tin chi tiết về giá, vị trí, tiện ích và đánh giá.</p>`
        + `<p>Hãy khám phá danh sách sân ${s} bên dưới và đặt sân ngay hôm nay!</p>`;
    case 'type_district':
      return `<p>${location} thuộc ${extra || ''} là khu vực có nhu cầu chơi ${s} lớn. Khu vực này có nhiều sân chất lượng, phù hợp cho cả người mới và người chơi lâu năm.</p>`
        + `<p>Tìm sân ${s} gần nhà tại ${location} và đặt sân ngay trên Sport Booking.</p>`;
    case 'price':
      return `<p>Tìm sân ${s} giá rẻ tại ${location} không khó. Sport Booking tổng hợp các sân có giá phải chăng, giúp bạn tiết kiệm chi phí mà vẫn được chơi tại những sân chất lượng.</p>`
        + `<p>Giá sân ${s} tại ${location} dao động tùy theo vị trí, thời gian và tiện ích.</p>`;
    case 'amenity':
      return `<p>Sân ${s} ${extra || ''} là lựa chọn lý tưởng cho người chơi tại ${location}. Với tiện ích này, bạn có thể chơi thoải mái trong mọi điều kiện.</p>`
        + `<p>Sport Booking tổng hợp các sân ${s} ${extra || ''} tại ${location}, giúp bạn dễ dàng tìm và đặt sân phù hợp nhất.</p>`;
    case 'time':
      return `<p>Bạn bận rộn ban ngày? ${location} có nhiều sân ${s} ${extra || ''}, phục vụ nhu cầu chơi thể thao mọi lúc.</p>`
        + `<p>Hệ thống đèn chiếu sáng chuyên nghiệp đảm bảo chất lượng chơi. Tìm và đặt sân ngay trên Sport Booking.</p>`;
    default:
      return `<p>Tìm và đặt sân ${s} tại ${location} trên Sport Booking. Nhanh chóng, tiện lợi và chính xác.</p>`;
  }
}
