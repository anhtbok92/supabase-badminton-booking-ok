import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { seoMetadataSchema } from '@/lib/seo-schema';
import { z } from 'zod';

async function getAdminUser(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seo_metadata')
      .select('*')
      .order('page_name', { ascending: true });

    if (error) {
      console.error('Error fetching SEO data:', error);
      return NextResponse.json({ error: 'Không thể tải dữ liệu SEO.' }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/admin/seo error:', err);
    return NextResponse.json({ error: 'Đã xảy ra lỗi server.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await getAdminUser(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let validatedData;
    try {
      validatedData = seoMetadataSchema.parse(body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json({ error: 'Dữ liệu không hợp lệ.', details: err.errors }, { status: 400 });
      }
      throw err;
    }

    const { data, error } = await supabase
      .from('seo_metadata')
      .upsert({
        page_slug: validatedData.page_slug,
        page_name: validatedData.page_name,
        meta_title: validatedData.meta_title,
        meta_description: validatedData.meta_description,
        meta_keywords: validatedData.meta_keywords,
        og_title: validatedData.og_title,
        og_description: validatedData.og_description,
        og_image_url: validatedData.og_image_url,
        og_type: validatedData.og_type,
        twitter_card: validatedData.twitter_card,
        twitter_title: validatedData.twitter_title,
        twitter_description: validatedData.twitter_description,
        twitter_image_url: validatedData.twitter_image_url,
        canonical_url: validatedData.canonical_url,
        robots: validatedData.robots,
        structured_data: validatedData.structured_data,
        custom_head_tags: validatedData.custom_head_tags,
      }, { onConflict: 'page_slug' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting SEO data:', error);
      return NextResponse.json({ error: 'Không thể lưu dữ liệu SEO.', detail: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error('PUT /api/admin/seo error:', err);
    return NextResponse.json({ error: 'Đã xảy ra lỗi server.' }, { status: 500 });
  }
}
