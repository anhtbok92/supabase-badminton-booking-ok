---
inclusion: manual
---

# SEO Pages System — Logic & Architecture

## Tổng quan

Hệ thống SEO pages nằm trên **landing site** (sportbooking.online), tách biệt hoàn toàn với **app** (app.sportbooking.online). Mục đích: tạo các trang HTML server-rendered để Google index, dẫn user sang app khi click "Đặt sân".

## Kiến trúc

### 2 loại trang SEO

1. **Trang detail** `/san/[slug]` — SSG + ISR, mỗi club 1 trang
2. **Trang listing** `/[seoSlug]` — SSG + ISR, mỗi combination filter 1 trang

### 6 loại listing SEO

| Loại | Ví dụ slug | Filter logic |
|------|-----------|-------------|
| Type + City | `san-cau-long-ha-noi` | `club_type` + `city` |
| Type + District | `san-cau-long-hoang-mai` | `club_type` + `district` |
| Near Location | `san-cau-long-gan-my-dinh` | `lat/lng` + `radius_km` |
| Price | `san-cau-long-gia-re-ha-noi` | `club_type` + `max_price` + `city` |
| Amenity | `san-cau-long-co-mai-che-ha-noi` | `club_type` + `amenity` + `city` |
| Time | `san-cau-long-mo-dem-ha-noi` | `club_type` + `time_filter` + `city` |

### Data flow

```
Club tạo/edit (admin form)
  → Chủ club chọn: tỉnh/thành, quận/huyện, tiện ích, giờ mở/đóng
  → Save club → auto trigger POST /api/seo/generate-pages
  → seo-generator.ts scan ALL active clubs
  → Tạo combinations thực tế từ data (KHÔNG seed cứng)
  → Upsert vào bảng seo_landing_pages
  → Pages cũ không còn club match → deactivate
```

## Database

### Bảng `seo_landing_pages`
- `slug` (unique) — URL path
- `page_type` — loại trang (type_city, type_district, near_location, price, amenity, time)
- `title`, `meta_description`, `h1_title` — SEO metadata
- `seo_content` — HTML content ~300 chữ (auto-generated)
- `filter_params` (JSONB) — params để query clubs, ví dụ: `{"club_type": "Cầu lông", "city": "ha-noi"}`
- `is_active` — tự động set false khi không còn club match

### Fields mới trên bảng `clubs` (migration 018)
- `city`, `district` — slug tỉnh/thành, quận/huyện (chọn từ dropdown)
- `open_time`, `close_time` — giờ mở/đóng cửa (HH:mm)
- `has_roof`, `has_lighting`, `has_parking` — boolean tiện ích (legacy, dùng dynamic amenities thay thế)
- `indoor_outdoor` — enum: indoor / outdoor / both (legacy)

### Bảng `amenity_types` (migration 019) — Tiện ích động
- `name`, `slug`, `icon`, `order` — admin quản lý qua UI
- Ví dụ: Mái che, Trong nhà, Đèn chiếu sáng, Bãi đỗ xe, WiFi, Điều hòa...

### Bảng `club_amenities` (migration 019) — Junction table
- `club_id` + `amenity_type_id` — many-to-many giữa clubs và amenity_types
- Admin chọn tiện ích khi tạo/edit club

### Function `nearby_clubs(lat, lng, radius_km, sport_type)`
- Haversine formula trong PostgreSQL
- Dùng cho loại "near_location"

## Files quan trọng

| File | Mô tả |
|------|-------|
| `src/lib/seo-pages.ts` | Data fetching cho SEO pages (dùng `createStaticClient` — không cookies) |
| `src/lib/seo-generator.ts` | Logic auto-generate SEO landing pages từ club data |
| `src/lib/vietnam-locations.ts` | Data tỉnh/thành, quận/huyện Việt Nam |
| `src/app/san/[slug]/page.tsx` | Trang detail SEO — SSG + ISR |
| `src/app/san/[slug]/_components/` | Components tách nhỏ: image gallery, info, pricing, map |
| `src/app/[seoSlug]/page.tsx` | Trang listing SEO — SSG + ISR, có RESERVED_SLUGS check |
| `src/app/[seoSlug]/_components/seo-listing-content.tsx` | UI listing |
| `src/components/seo-club-card.tsx` | Card component dùng chung cho listing |
| `src/app/api/seo/generate-pages/route.ts` | API endpoint trigger generate |
| `src/app/admin/_components/club-seo-fields.tsx` | Form fields SEO trong admin |
| `src/app/admin/_components/seo-pages-generator.tsx` | Admin UI quản lý SEO pages |
| `supabase/migrations/018_seo_pages.sql` | Migration: fields mới + bảng + function |

## Quy tắc quan trọng

1. **KHÔNG seed cứng** — SEO pages phải generate từ data thực trong DB
2. **KHÔNG sửa app** — app.sportbooking.online không bị ảnh hưởng
3. **KHÔNG redirect tự động** — chỉ link sang app khi user click "Đặt sân"
4. **Server-side render** — tất cả SEO pages phải SSR/SSG, không client-only
5. **ISR revalidate = 3600** — tự động cập nhật mỗi giờ
6. **`createStaticClient()`** — dùng cho SEO data fetching (không dùng cookies, tránh lỗi build-time)
7. **`[seoSlug]` route** — có `RESERVED_SLUGS` set để tránh conflict với routes khác
8. **Auto-trigger** — khi save club → tự động gọi `/api/seo/generate-pages` ở background
