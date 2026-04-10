import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const placeSchema = z.object({
  places: z.array(z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string().optional().default(''),
    latitude: z.number(),
    longitude: z.number(),
    rating: z.number().optional().default(0),
    operating_hours: z.string().optional().default(''),
    description: z.string().optional().default(''),
    amenities: z.array(z.string()).optional().default([]),
  })),
});

/**
 * POST /api/crawl/places
 * Use Gemini AI to find real sports venues in a given area
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!process.env.GOOGLE_GENAI_API_KEY) {
    return NextResponse.json({ error: 'Thiếu GOOGLE_GENAI_API_KEY' }, { status: 500 });
  }

  const { city, district, clubType } = await request.json();
  if (!city || !clubType) {
    return NextResponse.json({ error: 'city và clubType là bắt buộc' }, { status: 400 });
  }

  const location = district ? `${district}, ${city}` : city;

  try {
    const response = await ai.generate({
      prompt: `Bạn là chuyên gia về các sân thể thao tại Việt Nam. Hãy liệt kê TẤT CẢ các sân ${clubType} THẬT có tại ${location}, Việt Nam.

Yêu cầu QUAN TRỌNG:
- Chỉ liệt kê các sân CÓ THẬT, ĐANG HOẠT ĐỘNG. Không bịa đặt.
- Cung cấp thông tin chính xác nhất có thể dựa trên kiến thức của bạn.
- Mỗi sân cần: tên đầy đủ, địa chỉ chi tiết, số điện thoại (nếu biết), tọa độ GPS (latitude/longitude chính xác), rating (1-5), giờ hoạt động, mô tả ngắn, tiện ích.
- Nếu không biết chính xác số điện thoại, để trống.
- Tọa độ GPS phải chính xác cho khu vực ${location}.
- Liệt kê tối đa 20 sân.
- Tiện ích có thể bao gồm: mái che, trong nhà, ngoài trời, đèn chiếu sáng, bãi đỗ xe, điều hòa, phòng thay đồ, căng tin, wifi, sân cỏ nhân tạo.

Trả về JSON theo format yêu cầu.`,
      output: {
        format: 'json',
        schema: placeSchema,
      },
    });

    const data = response.output;
    if (!data || !data.places) {
      return NextResponse.json({ places: [], total: 0, query: `sân ${clubType} ${location}` });
    }

    // Add unique IDs
    const places = data.places.map((p, i) => ({
      ...p,
      place_id: `ai-${Date.now()}-${i}`,
      photo_urls: [] as string[],
    }));

    return NextResponse.json({
      places,
      total: places.length,
      query: `sân ${clubType} ${location}`,
    });
  } catch (error: any) {
    console.error('AI crawl error:', error);
    return NextResponse.json({ error: `AI error: ${error.message}` }, { status: 500 });
  }
}
