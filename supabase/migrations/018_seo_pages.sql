-- 018_seo_pages.sql
-- Add facility fields to clubs for SEO filtering
-- Add seo_landing_pages table for managing SEO listing pages

-- 1. Add new fields to clubs table for facility/amenity filtering
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS has_roof BOOLEAN DEFAULT FALSE;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS indoor_outdoor TEXT DEFAULT 'outdoor' CHECK (indoor_outdoor IN ('indoor', 'outdoor', 'both'));
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS has_lighting BOOLEAN DEFAULT TRUE;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT FALSE;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS open_time TEXT; -- e.g. '05:00'
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS close_time TEXT; -- e.g. '23:00'
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS city TEXT; -- e.g. 'ha-noi'
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS district TEXT; -- e.g. 'hoang-mai'

-- Index for geo queries
CREATE INDEX IF NOT EXISTS idx_clubs_lat_lng ON public.clubs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_clubs_city ON public.clubs(city);
CREATE INDEX IF NOT EXISTS idx_clubs_district ON public.clubs(district);

-- 2. SEO Landing Pages table - stores all generated SEO listing pages
CREATE TABLE IF NOT EXISTS public.seo_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE, -- e.g. 'san-cau-long-ha-noi'
  page_type TEXT NOT NULL CHECK (page_type IN ('type_city', 'type_district', 'near_location', 'price', 'amenity', 'time')),
  title TEXT NOT NULL,
  meta_description TEXT,
  h1_title TEXT NOT NULL,
  seo_content TEXT, -- ~300 word SEO text
  filter_params JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_slug ON public.seo_landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_type ON public.seo_landing_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_active ON public.seo_landing_pages(is_active);

-- Enable RLS
ALTER TABLE public.seo_landing_pages ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access to seo_landing_pages"
  ON public.seo_landing_pages
  FOR SELECT
  USING (true);

-- Admin full access
CREATE POLICY "Admin full access to seo_landing_pages"
  ON public.seo_landing_pages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_seo_landing_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_seo_landing_pages_updated_at
  BEFORE UPDATE ON public.seo_landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_landing_pages_updated_at();

-- 3. Supabase function for geo-distance query (Haversine)
CREATE OR REPLACE FUNCTION nearby_clubs(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5,
  sport_type TEXT DEFAULT NULL
)
RETURNS SETOF public.clubs AS $$
  SELECT *
  FROM public.clubs
  WHERE is_active = TRUE
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND (sport_type IS NULL OR club_type = sport_type)
    AND (
      6371 * acos(
        cos(radians(lat)) * cos(radians(latitude))
        * cos(radians(longitude) - radians(lng))
        + sin(radians(lat)) * sin(radians(latitude))
      )
    ) <= radius_km
  ORDER BY (
    6371 * acos(
      cos(radians(lat)) * cos(radians(latitude))
      * cos(radians(longitude) - radians(lng))
      + sin(radians(lat)) * sin(radians(latitude))
    )
  );
$$ LANGUAGE sql STABLE;
