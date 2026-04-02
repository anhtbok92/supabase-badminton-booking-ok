import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('seo_metadata')
      .select('*')
      .eq('page_slug', slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ data: null }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi server.' }, { status: 500 });
  }
}
