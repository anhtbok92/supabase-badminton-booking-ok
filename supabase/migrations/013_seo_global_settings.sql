-- Migration: 013_seo_global_settings.sql
-- Add global SEO settings to site_settings table

INSERT INTO public.site_settings (key, value)
VALUES (
    'seo_global',
    '{
        "robots_txt": "User-agent: *\nAllow: /\n\nSitemap: https://sportbooking.online/sitemap.xml",
        "google_site_verification": "",
        "fb_app_id": "",
        "site_name": "Sport Booking"
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
