import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Thiếu GEMINI_API_KEY' }, { status: 500 });
    }

    const { topic, keywords, length } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: 'Chủ đề là bắt buộc' }, { status: 400 });
    }

    const lengthGuide = length === 'short' ? '800-1200 từ' : length === 'long' ? '2500-3500 từ' : '1500-2000 từ';
    const keywordList = keywords?.length ? keywords.join(', ') : '';

    const prompt = `Bạn là một chuyên gia viết blog SEO về thể thao, đặc biệt là cầu lông, đặt sân thể thao tại Việt Nam.

Hãy viết một bài blog chất lượng cao về chủ đề: "${topic}"
${keywordList ? `Từ khóa SEO cần tối ưu: ${keywordList}` : ''}
Độ dài mong muốn: ${lengthGuide}

YÊU CẦU BẮT BUỘC:
1. Tiêu đề (title): Thu hút, chứa từ khóa chính, tối đa 70 ký tự
2. Mô tả ngắn (shortDescription): 150-160 ký tự, chứa từ khóa, hấp dẫn người đọc click
3. SEO Title: Tối ưu cho Google, tối đa 60 ký tự
4. SEO Description: Meta description chuẩn SEO, 150-160 ký tự
5. Nội dung (contentHtml): HTML sạch tuân thủ cấu trúc SEO:
   - Mở đầu hấp dẫn với từ khóa chính trong 100 từ đầu
   - Sử dụng thẻ <h2> cho heading chính, <h3> cho heading phụ
   - Đoạn văn ngắn 2-4 câu, dễ đọc
   - Sử dụng <ul>/<ol> cho danh sách
   - Sử dụng <strong> cho từ khóa quan trọng
   - Có phần kết luận rõ ràng
   - KHÔNG dùng class CSS hay style inline
   - KHÔNG dùng thẻ <h1> (đã có title)

Trả về JSON với format:
{
  "title": "...",
  "shortDescription": "...",
  "seoTitle": "...",
  "seoDescription": "...",
  "contentHtml": "..."
}

CHỈ trả về JSON, không có text nào khác.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
    const jsonStr = jsonMatch[1]?.trim() || text.trim();
    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Blog Generate Error:', error);
    return NextResponse.json(
      { error: `Lỗi tạo bài viết: ${error.message}` },
      { status: 500 }
    );
  }
}
