-- 019_dynamic_amenities.sql
-- Dynamic amenity management: amenity_types + club_amenities junction table

-- 1. Amenity types table (admin-managed)
CREATE TABLE IF NOT EXISTS public.amenity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- e.g. 'Mái che', 'Bãi đỗ xe', 'Đèn chiếu sáng'
  slug TEXT NOT NULL UNIQUE,    -- e.g. 'mai-che', 'bai-do-xe', 'den-chieu-sang'
  icon TEXT,                    -- optional icon name or emoji
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amenity_types_order ON public.amenity_types("order");

-- Enable RLS
ALTER TABLE public.amenity_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to amenity_types"
  ON public.amenity_types FOR SELECT USING (true);

CREATE POLICY "Admin full access to amenity_types"
  ON public.amenity_types FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 2. Club-amenity junction table
CREATE TABLE IF NOT EXISTS public.club_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  amenity_type_id UUID NOT NULL REFERENCES public.amenity_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, amenity_type_id)
);

CREATE INDEX IF NOT EXISTS idx_club_amenities_club ON public.club_amenities(club_id);
CREATE INDEX IF NOT EXISTS idx_club_amenities_amenity ON public.club_amenities(amenity_type_id);

ALTER TABLE public.club_amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to club_amenities"
  ON public.club_amenities FOR SELECT USING (true);

CREATE POLICY "Admin full access to club_amenities"
  ON public.club_amenities FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 3. Seed default amenity types
INSERT INTO public.amenity_types (name, slug, icon, "order") VALUES
  ('Mái che', 'mai-che', '🏠', 1),
  ('Trong nhà', 'trong-nha', '🏢', 2),
  ('Ngoài trời', 'ngoai-troi', '☀️', 3),
  ('Đèn chiếu sáng', 'den-chieu-sang', '💡', 4),
  ('Bãi đỗ xe', 'bai-do-xe', '🅿️', 5),
  ('Điều hòa', 'dieu-hoa', '❄️', 6),
  ('Phòng thay đồ', 'phong-thay-do', '🚿', 7),
  ('Căng tin', 'cang-tin', '🍜', 8),
  ('WiFi', 'wifi', '📶', 9),
  ('Sân cỏ nhân tạo', 'san-co-nhan-tao', '🌿', 10)
ON CONFLICT (slug) DO NOTHING;
