'use client';

import { z } from 'zod';

// Login
export const loginSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ.' }),
    password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' }),
    rememberMe: z.boolean().default(false),
});
export type LoginSchema = z.infer<typeof loginSchema>;

// Club Owner
export const clubOwnerSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ.' }),
    password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' }),
    managedClubIds: z.array(z.string()).optional(),
});
export type ClubOwnerSchema = z.infer<typeof clubOwnerSchema>;

export const clubOwnerEditSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ.' }),
    managedClubIds: z.array(z.string()).optional(),
});
export type ClubOwnerEditSchema = z.infer<typeof clubOwnerEditSchema>;

// Staff
export const staffSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ.' }),
    password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' }),
    managedClubIds: z.array(z.string()).optional(),
});
export type StaffSchema = z.infer<typeof staffSchema>;

export const staffEditSchema = z.object({
    email: z.string().email({ message: 'Email không hợp lệ.' }),
    managedClubIds: z.array(z.string()).optional(),
});
export type StaffEditSchema = z.infer<typeof staffEditSchema>;


// Pricing
export const priceTierSchema = z.object({
    timeRange: z.tuple([
        z.string().regex(/^(([0-1]?[0-9]|2[0-3]):[0-5][0-9]|24:00)$/, 'Sai định dạng giờ (HH:mm)'),
        z.string().regex(/^(([0-1]?[0-9]|2[0-3]):[0-5][0-9]|24:00)$/, 'Sai định dạng giờ (HH:mm)')
    ]),
    price: z.coerce.number().min(0, 'Giá phải lớn hơn 0'),
});

// Club
export const clubSchema = z.object({
    name: z.string().min(1, 'Tên không được để trống'),
    address: z.string().min(1, 'Địa chỉ không được để trống'),
    phone: z.string().min(1, 'Số điện thoại không được để trống'),
    clubType: z.string().min(1, 'Vui lòng chọn loại câu lạc bộ'),
    rating: z.coerce.number().min(0, 'Rating phải từ 0-5').max(5, 'Rating phải từ 0-5').optional(),
    imageUrls: z.array(z.string().url()).optional(),
    pricing: z.object({
        weekday: z.array(priceTierSchema),
        weekend: z.array(priceTierSchema),
    }),
    operatingHours: z.string().optional(),
    servicesHtml: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    isActive: z.boolean().default(true),
    paymentQrUrl: z.string().optional(),
    priceListHtml: z.string().optional(),
    priceListImageUrl: z.string().optional(),
    mapVideoUrl: z.string().optional(),
});
export type ClubSchema = z.infer<typeof clubSchema>;

// Court
export const courtFormSchema = z.object({
    name: z.string().min(1, 'Tên sân không được để trống'),
    description: z.string().optional(),
    order: z.coerce.number().optional(),
});
export type CourtFormSchema = z.infer<typeof courtFormSchema>;

// News
export const newsFormSchema = z.object({
    title: z.string().min(1, 'Tiêu đề không được để trống'),
    shortDescription: z.string().min(1, 'Mô tả ngắn không được để trống'),
    contentHtml: z.string().min(1, 'Nội dung không được để trống'),
    tags: z.array(z.string()).optional(),
});
export type NewsFormSchema = z.infer<typeof newsFormSchema>;

// Tag
export const newTagSchema = z.object({
    name: z.string().min(1, 'Tên tag không được để trống').refine(s => !s.includes('/'), { message: 'Tên tag không được chứa ký tự "/"' }),
});
export type NewTagSchema = z.infer<typeof newTagSchema>;

// Club Type
export const clubTypeSchema = z.object({
    name: z.string().min(1, 'Tên loại không được để trống'),
    order: z.coerce.number().default(0),
});
export type ClubTypeSchema = z.infer<typeof clubTypeSchema>;

// ============================================================
// Subscription Management Schemas
// ============================================================

// Subscription Plan Features
export const subscriptionPlanFeaturesSchema = z.object({
    trial_months: z.number().optional(),
    support: z.enum(['email', 'priority']),
    analytics: z.boolean().optional(),
    custom_features: z.boolean().optional(),
});
export type SubscriptionPlanFeaturesSchema = z.infer<typeof subscriptionPlanFeaturesSchema>;

// Subscription Plan
export const subscriptionPlanSchema = z.object({
    name: z.enum(['FREE', 'BASIC', 'PRO'], { 
        errorMap: () => ({ message: 'Tên gói phải là FREE, BASIC hoặc PRO' }) 
    }),
    display_name: z.string().min(1, 'Tên hiển thị không được để trống'),
    max_courts: z.coerce.number().int().min(1, 'Số sân tối đa phải lớn hơn 0'),
    max_bookings_per_month: z.coerce.number().int().min(0, 'Số booking tối đa phải lớn hơn hoặc bằng 0'),
    monthly_price: z.coerce.number().int().min(0, 'Giá tháng phải lớn hơn hoặc bằng 0'),
    yearly_price: z.coerce.number().int().min(0, 'Giá năm phải lớn hơn hoặc bằng 0'),
    overage_fee_per_booking: z.coerce.number().int().min(0, 'Phí vượt mức phải lớn hơn hoặc bằng 0'),
    is_active: z.boolean().default(true),
    features: subscriptionPlanFeaturesSchema.optional(),
});
export type SubscriptionPlanSchema = z.infer<typeof subscriptionPlanSchema>;

// Club Subscription
export const clubSubscriptionSchema = z.object({
    club_id: z.string().uuid('Club ID không hợp lệ'),
    plan_id: z.string().uuid('Plan ID không hợp lệ'),
    billing_cycle: z.enum(['monthly', 'yearly'], {
        errorMap: () => ({ message: 'Chu kỳ thanh toán phải là monthly hoặc yearly' })
    }),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu phải có định dạng YYYY-MM-DD'),
    auto_renew: z.boolean().default(false),
});
export type ClubSubscriptionSchema = z.infer<typeof clubSubscriptionSchema>;

// Club Subscription Update
export const clubSubscriptionUpdateSchema = z.object({
    plan_id: z.string().uuid('Plan ID không hợp lệ').optional(),
    billing_cycle: z.enum(['monthly', 'yearly']).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc phải có định dạng YYYY-MM-DD').optional(),
    is_active: z.boolean().optional(),
    auto_renew: z.boolean().optional(),
});
export type ClubSubscriptionUpdateSchema = z.infer<typeof clubSubscriptionUpdateSchema>;

// ============================================================
// Fixed Monthly Booking Schema
// ============================================================

export const fixedMonthlyConfigSchema = z.object({
  club_id: z.string().uuid('Club ID không hợp lệ'),
  court_id: z.string().uuid('Sân không hợp lệ'),
  day_of_week: z.coerce.number().min(0).max(6),
  start_time: z.string().regex(/^(([0-1]?[0-9]|2[0-3]):[0-5][0-9]|24:00)$/, 'Sai định dạng giờ (HH:mm)'),
  end_time: z.string().regex(/^(([0-1]?[0-9]|2[0-3]):[0-5][0-9]|24:00)$/, 'Sai định dạng giờ (HH:mm)'),
  customer_name: z.string().min(1, 'Tên khách hàng không được để trống'),
  customer_phone: z.string().min(1, 'Số điện thoại không được để trống'),
  total_price: z.coerce.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  is_active: z.boolean().default(true),
  is_auto_renew: z.boolean().default(true),
  note: z.string().optional(),
});
export type FixedMonthlyConfigSchema = z.infer<typeof fixedMonthlyConfigSchema>;

// SEO Metadata Schema - re-export from shared file (usable in both client & server)
export { seoMetadataSchema, type SeoMetadataSchema } from '@/lib/seo-schema';
