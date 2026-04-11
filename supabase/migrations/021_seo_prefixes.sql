-- 021_seo_prefixes.sql
-- Dynamic SEO prefix/suffix for multiplying SEO landing pages

CREATE TABLE IF NOT EXISTS public.seo_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('prefix', 'suffix')),
  label TEXT NOT NULL,        -- Display: "Thuê", "Cho thuê", "Tốt nhất"
  slug TEXT NOT NULL UNIQUE,  -- URL part: "thue", "cho-thue", "tot-nhat"
  is_active BOOLEAN DEFAULT TRUE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.seo_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read seo_modifiers" ON public.seo_modifiers FOR SELECT USING (true);
CREATE POLICY "Admin full seo_modifiers" ON public.seo_modifiers FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Seed some common prefixes
INSERT INTO public.seo_modifiers (type, label, slug, "order") VALUES
  ('prefix', 'Thuê', 'thue', 1),
  ('prefix', 'Cho thuê', 'cho-thue', 2),
  ('prefix', 'Đặt', 'dat', 3),
  ('suffix', 'tốt nhất', 'tot-nhat', 1),
  ('suffix', 'uy tín', 'uy-tin', 2),
  ('suffix', 'chất lượng', 'chat-luong', 3)
ON CONFLICT (slug) DO NOTHING;
