import { SupabaseClient } from '@supabase/supabase-js';
import { PROVINCES } from '@/lib/vietnam-locations';

type ClubRow = {
  club_type: string;
  city: string | null;
  district: string | null;
  has_roof: boolean;
  indoor_outdoor: string;
  has_lighting: boolean;
  has_parking: boolean;
  open_time: string | null;
  close_time: string | null;
  latitude: number | null;
  longitude: number | null;
};

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

  // 1. Fetch all active clubs with relevant fields
  const { data: clubs, error: clubsErr } = await supabase
    .from('clubs')
    .select('club_type, city, district, has_roof, indoor_outdoor, has_lighting, has_parking, open_time, close_time, latitude, longitude')
    .eq('is_active', true);

  if (clubsErr || !clubs) {
    return { generated: 0, removed: 0, errors: [`Failed to fetch clubs: ${clubsErr?.message}`] };
  }

  // 2. Fetch club types from DB
  const { data: clubTypes } = await supabase.from('club_types').select('name');
  const typeNames = (clubTypes || []).map(t => t.name);

  // 3. Build all valid combinations
  const pages: SeoPageInsert[] = [];

  // Helper to get display names
  const getCityName = (slug: string) => PROVINCES.find(p => p.slug === slug)?.name || slug;
  const getDistrictName = (citySlug: string, distSlug: string) => {
    const prov = PROVINCES.find(p => p.slug === citySlug);
    return prov?.districts.find(d => d.slug === distSlug)?.name || distSlug;
  };
  const typeSlug = (name: string) => slugify(name);

  // Collect unique combinations from actual data
  const typeCityCombos = new Set<string>();
  const typeDistrictCombos = new Set<string>();
  const amenityCombos = new Set<string>();
  const timeCombos = new Set<string>();

  for (const club of clubs as ClubRow[]) {
    if (!club.club_type) continue;
    const type = club.club_type;

    // Type + City
    if (club.city) {
      typeCityCombos.add(`${type}|${club.city}`);
    }

    // Type + District
    if (club.city && club.district) {
      typeDistrictCombos.add(`${type}|${club.city}|${club.district}`);
    }

    // Amenities (only if club has the amenity AND city)
    if (club.city) {
      if (club.has_roof) amenityCombos.add(`${type}|has_roof|${club.city}`);
      if (club.indoor_outdoor === 'indoor') amenityCombos.add(`${type}|indoor|${club.city}`);
      if (club.has_parking) amenityCombos.add(`${type}|has_parking|${club.city}`);
      if (club.has_lighting) amenityCombos.add(`${type}|has_lighting|${club.city}`);
    }

    // Time-based (night = close >= 21:00, 24h)
    if (club.city && club.close_time) {
      if (club.close_time >= '21:00' || club.close_time === '00:00') {
        timeCombos.add(`${type}|night|${club.city}`);
      }
    }
  }

  // --- Generate Type + City pages ---
  for (const combo of typeCityCombos) {
    const [type, city] = combo.split('|');
    const cityName = getCityName(city);
    const slug = `san-${typeSlug(type)}-${city}`;
    pages.push({
      slug,
      page_type: 'type_city',
      title: `Sân ${type} ${cityName} - Đặt sân online | Sport Booking`,
      meta_description: `Danh sách sân ${type} tại ${cityName}. Đặt sân online nhanh chóng, giá tốt nhất. Xem địa chỉ, giá và đánh giá.`,
      h1_title: `Sân ${type} tại ${cityName}`,
      seo_content: buildSeoContent('type_city', type, cityName),
      filter_params: { club_type: type, city, city_name: cityName },
    });

    // Also generate price page per type+city
    pages.push({
      slug: `san-${typeSlug(type)}-gia-re-${city}`,
      page_type: 'price',
      title: `Sân ${type} giá rẻ ${cityName} - Dưới 200k/giờ | Sport Booking`,
      meta_description: `Danh sách sân ${type} giá rẻ tại ${cityName}, giá dưới 200.000đ/giờ.`,
      h1_title: `Sân ${type} giá rẻ tại ${cityName}`,
      seo_content: buildSeoContent('price', type, cityName),
      filter_params: { club_type: type, max_price: 200000, city, city_name: cityName },
    });
  }

  // --- Generate Type + District pages ---
  for (const combo of typeDistrictCombos) {
    const [type, city, district] = combo.split('|');
    const districtName = getDistrictName(city, district);
    const cityName = getCityName(city);
    const slug = `san-${typeSlug(type)}-${district}`;
    pages.push({
      slug,
      page_type: 'type_district',
      title: `Sân ${type} ${districtName} - Đặt sân online | Sport Booking`,
      meta_description: `Danh sách sân ${type} tại ${districtName}, ${cityName}. Đặt sân online nhanh chóng.`,
      h1_title: `Sân ${type} tại ${districtName}`,
      seo_content: buildSeoContent('type_district', type, districtName, cityName),
      filter_params: { club_type: type, district, district_name: districtName, city, city_name: cityName },
    });
  }

  // --- Generate Amenity pages ---
  for (const combo of amenityCombos) {
    const [type, amenity, city] = combo.split('|');
    const cityName = getCityName(city);
    const amenityLabel = AMENITY_LABELS[amenity] || amenity;
    const slug = `san-${typeSlug(type)}-${amenitySlug(amenity)}-${city}`;
    pages.push({
      slug,
      page_type: 'amenity',
      title: `Sân ${type} ${amenityLabel} ${cityName} | Sport Booking`,
      meta_description: `Danh sách sân ${type} ${amenityLabel} tại ${cityName}.`,
      h1_title: `Sân ${type} ${amenityLabel} tại ${cityName}`,
      seo_content: buildSeoContent('amenity', type, cityName, amenityLabel),
      filter_params: { club_type: type, amenity, city, city_name: cityName },
    });
  }

  // --- Generate Time pages ---
  for (const combo of timeCombos) {
    const [type, timeFilter, city] = combo.split('|');
    const cityName = getCityName(city);
    const timeLabel = timeFilter === 'night' ? 'mở đêm' : 'mở 24h';
    const slug = `san-${typeSlug(type)}-${timeFilter === 'night' ? 'mo-dem' : 'mo-24h'}-${city}`;
    pages.push({
      slug,
      page_type: 'time',
      title: `Sân ${type} ${timeLabel} ${cityName} | Sport Booking`,
      meta_description: `Danh sách sân ${type} ${timeLabel} tại ${cityName}.`,
      h1_title: `Sân ${type} ${timeLabel} tại ${cityName}`,
      seo_content: buildSeoContent('time', type, cityName, timeLabel),
      filter_params: { club_type: type, time_filter: timeFilter, city, city_name: cityName },
    });
  }

  // 4. Upsert all pages (insert or update on conflict)
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

  // 5. Remove pages that no longer have matching clubs
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

const AMENITY_LABELS: Record<string, string> = {
  has_roof: 'có mái che',
  indoor: 'trong nhà',
  has_parking: 'có bãi đỗ xe',
  has_lighting: 'có đèn chiếu sáng',
};

function amenitySlug(amenity: string): string {
  const map: Record<string, string> = {
    has_roof: 'co-mai-che',
    indoor: 'trong-nha',
    has_parking: 'co-bai-do-xe',
    has_lighting: 'co-den',
  };
  return map[amenity] || amenity;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildSeoContent(
  pageType: string,
  sportType: string,
  location: string,
  extra?: string,
): string {
  switch (pageType) {
    case 'type_city':
      return `<p>${location} là một trong những khu vực có phong trào ${sportType.toLowerCase()} phát triển mạnh. Với nhiều sân từ cơ bản đến chuyên nghiệp, người chơi có thể dễ dàng tìm được sân phù hợp với nhu cầu và ngân sách.</p>`
        + `<p>Sport Booking giúp bạn tìm và đặt sân ${sportType.toLowerCase()} tại ${location} một cách nhanh chóng và tiện lợi. Hệ thống hiển thị thông tin chi tiết về giá, vị trí, tiện ích và đánh giá từ người chơi khác.</p>`
        + `<p>Hãy khám phá danh sách sân ${sportType.toLowerCase()} bên dưới và đặt sân ngay hôm nay!</p>`;

    case 'type_district':
      return `<p>${location} thuộc ${extra || ''} là khu vực có nhu cầu chơi ${sportType.toLowerCase()} lớn. Khu vực này có nhiều sân chất lượng, phù hợp cho cả người mới và người chơi lâu năm.</p>`
        + `<p>Tìm sân ${sportType.toLowerCase()} gần nhà tại ${location} và đặt sân ngay trên Sport Booking. Thông tin giá, địa chỉ và đánh giá luôn được cập nhật mới nhất.</p>`;

    case 'price':
      return `<p>Tìm sân ${sportType.toLowerCase()} giá rẻ tại ${location} không khó nếu bạn biết cách. Sport Booking tổng hợp các sân có giá phải chăng, giúp bạn tiết kiệm chi phí mà vẫn được chơi tại những sân chất lượng.</p>`
        + `<p>Giá sân ${sportType.toLowerCase()} tại ${location} dao động tùy theo vị trí, thời gian và tiện ích. Các sân giá rẻ thường có khung giờ ưu đãi vào buổi sáng sớm và trưa.</p>`;

    case 'amenity':
      return `<p>Sân ${sportType.toLowerCase()} ${extra || ''} là lựa chọn lý tưởng cho người chơi tại ${location}. Với tiện ích này, bạn có thể chơi thoải mái trong mọi điều kiện.</p>`
        + `<p>Sport Booking tổng hợp các sân ${sportType.toLowerCase()} ${extra || ''} tại ${location}, giúp bạn dễ dàng tìm và đặt sân phù hợp nhất.</p>`;

    case 'time':
      return `<p>Bạn bận rộn ban ngày và chỉ có thể chơi ${sportType.toLowerCase()} vào buổi tối? ${location} có nhiều sân ${sportType.toLowerCase()} ${extra || ''}, phục vụ nhu cầu chơi thể thao mọi lúc.</p>`
        + `<p>Hệ thống đèn chiếu sáng chuyên nghiệp đảm bảo chất lượng chơi không khác gì ban ngày. Tìm và đặt sân ngay trên Sport Booking.</p>`;

    default:
      return `<p>Tìm và đặt sân ${sportType.toLowerCase()} tại ${location} trên Sport Booking. Nhanh chóng, tiện lợi và chính xác.</p>`;
  }
}
