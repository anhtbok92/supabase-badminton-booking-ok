-- SEO Metadata table for Yoast-like SEO management
CREATE TABLE IF NOT EXISTS seo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL UNIQUE, -- e.g. 'landing', 'app-home', 'booking', 'news', 'privacy', 'terms'
  page_name TEXT NOT NULL, -- Display name e.g. 'Trang chủ Landing Page'
  
  -- Basic SEO
  meta_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  meta_keywords TEXT DEFAULT '',
  
  -- Open Graph
  og_title TEXT DEFAULT '',
  og_description TEXT DEFAULT '',
  og_image_url TEXT DEFAULT '',
  og_type TEXT DEFAULT 'website',
  
  -- Twitter Card
  twitter_card TEXT DEFAULT 'summary_large_image',
  twitter_title TEXT DEFAULT '',
  twitter_description TEXT DEFAULT '',
  twitter_image_url TEXT DEFAULT '',
  
  -- Advanced SEO
  canonical_url TEXT DEFAULT '',
  robots TEXT DEFAULT 'index, follow',
  structured_data JSONB DEFAULT '{}',
  
  -- Custom head tags
  custom_head_tags TEXT DEFAULT '',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

-- Admin can read/write
CREATE POLICY "Admin full access to seo_metadata"
  ON seo_metadata
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Public can read (for rendering metadata)
CREATE POLICY "Public read access to seo_metadata"
  ON seo_metadata
  FOR SELECT
  USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_seo_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_seo_metadata_updated_at
  BEFORE UPDATE ON seo_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_metadata_updated_at();

-- Seed default pages
INSERT INTO seo_metadata (page_slug, page_name, meta_title, meta_description) VALUES
  ('landing', 'Trang Landing Page', 'Sport Booking - Hệ thống đặt sân thể thao thông minh', 'Giải pháp quản lý và đặt sân toàn diện cho câu lạc bộ thể thao. Đặt sân cầu lông, bóng đá, tennis, pickleball trực tuyến.'),
  ('app-home', 'Trang App chính', 'Sport Booking - Hệ thống Đặt sân Cầu lông', 'Đặt sân cầu lông yêu thích của bạn trực tuyến. Nhanh chóng, chính xác và chuyên nghiệp.'),
  ('booking', 'Trang Đặt sân', 'Đặt sân - Sport Booking', 'Đặt sân thể thao trực tuyến nhanh chóng và tiện lợi.'),
  ('news', 'Trang Tin tức', 'Tin tức - Sport Booking', 'Cập nhật tin tức mới nhất về thể thao và các câu lạc bộ.'),
  ('privacy', 'Chính sách bảo mật', 'Chính sách bảo mật - Sport Booking', 'Chính sách bảo mật và quyền riêng tư của Sport Booking.'),
  ('terms', 'Điều khoản dịch vụ', 'Điều khoản dịch vụ - Sport Booking', 'Điều khoản và điều kiện sử dụng dịch vụ Sport Booking.')
ON CONFLICT (page_slug) DO NOTHING;
