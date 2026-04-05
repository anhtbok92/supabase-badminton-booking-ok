-- Migration: 012_add_site_settings.sql
-- Create site_settings table for global configurations

CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Allow public read access to site_settings"
ON public.site_settings FOR SELECT
TO public
USING (true);

-- Allow admins to manage settings
CREATE POLICY "Allow admins full access to site_settings"
ON public.site_settings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Insert initial promo_popup setting
INSERT INTO public.site_settings (key, value)
VALUES (
    'promo_popup',
    '{
        "is_active": true,
        "badge": "Ưu đãi đặc biệt",
        "title": "Dùng thử miễn phí trọn bộ 3 tháng",
        "description": "Trải nghiệm toàn bộ tính năng PRO, không cần thẻ tín dụng.",
        "cta_text": "Đăng ký ngay — Miễn phí",
        "sub_text": "Không ràng buộc • Hủy bất cứ lúc nào",
        "delay_ms": 1500,
        "features": [
            "Không giới hạn số lượng sân",
            "Không giới hạn lượt đặt",
            "Dashboard thống kê chuyên sâu",
            "Quản lý đặt sân & lịch trình",
            "Đăng tin tức & khuyến mãi",
            "Hỗ trợ kỹ thuật 24/7"
        ]
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
