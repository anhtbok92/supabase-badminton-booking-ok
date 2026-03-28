import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import * as cheerio from 'cheerio';
import { z } from 'zod';
import axios from 'axios';
import * as https from 'https';

const agent = new https.Agent({
    rejectUnauthorized: false,
    secureOptions: 0x4, // SSL_OP_LEGACY_SERVER_CONNECT - Fix for ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED
});

export async function POST(req: NextRequest) {
    try {
        if (!process.env.GOOGLE_GENAI_API_KEY) {
            return NextResponse.json({
                error: 'Thiếu API Key cho AI (GOOGLE_GENAI_API_KEY). Vui lòng cấu hình trong biến môi trường.'
            }, { status: 500 });
        }

        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: 'URL là bắt buộc' }, { status: 400 });

        console.log('Fetching URL with axios (v2):', url);
        const response = await axios.get(url, {
            httpsAgent: agent,
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'max-age=0',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Referer': 'https://www.google.com/',
            },
            maxRedirects: 5,
        });

        const html = response.data;
        if (typeof html !== 'string') {
            throw new Error('Dữ liệu trả về không phải định dạng văn bản.');
        }
        console.log('Fetched HTML length:', html.length);
        const $ = cheerio.load(html);

        // Basic cleaning to reduce tokens
        $('script, style, nav, footer, header, .sidebar, #sidebar, ads').remove();

        // Attempt to get OG image
        const ogImage = $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content');

        // Get main text content
        const cleanText = $('body').text().replace(/\s+/g, ' ').trim();
        console.log('Clean text length:', cleanText.length);

        console.log('Starting AI generation...');
        const responseAi = await ai.generate({
            prompt: `Bạn là một biên tập viên tin tức cầu lông chuyên nghiệp. 
      Nhiệm vụ của bạn là trích xuất thông tin từ nội dung văn bản được crawl từ website dưới đây và biên soạn lại thành một bài viết tin tức chất lượng bằng TIẾNG VIỆT.
      
      Nguồn URL: ${url}
      
      Nội dung văn bản trích xuất:
      ${cleanText.substring(0, 15000)}
      
      Yêu cầu:
      1. Tiêu đề (title): Phải thu hút, chuẩn SEO và bằng tiếng Việt.
      2. Mô tả ngắn (shortDescription): Tóm tắt nội dung chính trong 2-3 câu, giọng văn lôi cuốn.
      3. Nội dung chi tiết (contentHtml): Chuyển đổi nội dung thành HTML sạch. Sử dụng các thẻ <p>, <h2>, <h3>, <ul>, <li>, <strong>. Không bao gồm các class CSS hoặc style inline. Hãy chia các đoạn văn hợp lý, chuyên nghiệp.
      4. Ảnh bìa (bannerImageUrl): Nếu có thể tìm thấy URL ảnh chính từ nội dung, hãy trả về. Ưu tiên: ${ogImage || 'Không có OG Image'}.
      
      Hãy đảm bảo nội dung tiếng Việt mượt mà, không bị sượng như dịch máy.`,
            output: {
                format: 'json',
                schema: z.object({
                    title: z.string(),
                    shortDescription: z.string(),
                    contentHtml: z.string(),
                    bannerImageUrl: z.string().optional(),
                })
            }
        });

        const data = responseAi.output;

        if (!data) {
            throw new Error('AI không thể trích xuất được nội dung bài viết.');
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Crawl API Error Detailed:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return NextResponse.json({
            error: `Lỗi Server: ${error.message || 'Hệ thống gặp sự cố khi crawl.'}`
        }, { status: 500 });
    }
}
