import { z } from 'zod';

export const seoMetadataSchema = z.object({
  page_slug: z.string().min(1, 'Slug trang không được để trống'),
  page_name: z.string().min(1, 'Tên trang không được để trống'),
  meta_title: z.string().max(70, 'Meta title nên dưới 70 ký tự').default(''),
  meta_description: z.string().max(160, 'Meta description nên dưới 160 ký tự').default(''),
  meta_keywords: z.string().default(''),
  og_title: z.string().default(''),
  og_description: z.string().default(''),
  og_image_url: z.string().default(''),
  og_type: z.string().default('website'),
  twitter_card: z.string().default('summary_large_image'),
  twitter_title: z.string().default(''),
  twitter_description: z.string().default(''),
  twitter_image_url: z.string().default(''),
  canonical_url: z.string().default(''),
  robots: z.string().default('index, follow'),
  structured_data: z.any().default({}),
  custom_head_tags: z.string().default(''),
});
export type SeoMetadataSchema = z.infer<typeof seoMetadataSchema>;
