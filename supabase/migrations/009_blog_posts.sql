------------------------------------------------------------
-- Blog Posts table
-- Bài viết blog viết bằng AI, hỗ trợ SEO
------------------------------------------------------------
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  content_html TEXT NOT NULL,
  banner_image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);

-- RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT USING (status = 'published');

-- Admin can do everything
CREATE POLICY "blog_posts_admin_all" ON public.blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
