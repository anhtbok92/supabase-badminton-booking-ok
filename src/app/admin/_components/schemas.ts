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
