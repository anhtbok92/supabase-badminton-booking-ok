import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'victory1080@gmail.com';

export async function POST(req: NextRequest) {
    try {
        console.log('=== Email notification API called ===');
        console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
        
        const body = await req.json();
        const { fullName, phoneNumber, clubName, address, courtCount, note } = body;

        console.log('Registration data:', { fullName, phoneNumber, clubName, address, courtCount });

        if (!fullName || !phoneNumber || !clubName) {
            return NextResponse.json({ error: 'Thiếu thông tin bắt buộc.' }, { status: 400 });
        }

        console.log('Sending email to:', ADMIN_EMAIL);
        const { data, error } = await resend.emails.send({
            from: 'Hệ thống Đặt sân <onboarding@resend.dev>',
            to: ADMIN_EMAIL,
            subject: `[Đăng ký mới] ${clubName} - ${fullName}`,
            html: `
                <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                    <h2 style="color:#16a34a;margin:0 0 16px;">🏸 Có đăng ký hợp tác mới!</h2>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#666;width:140px;">Họ tên chủ sân</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${fullName}</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#666;">Số điện thoại</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${phoneNumber}</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#666;">Tên CLB/Sân</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${clubName}</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#666;">Địa chỉ</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${address}</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#666;">Số sân</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${courtCount}</td></tr>
                        ${note ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#666;">Ghi chú</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${note}</td></tr>` : ''}
                    </table>
                    <p style="margin-top:20px;font-size:13px;color:#999;">Email tự động từ hệ thống đặt sân cầu lông.</p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ error: 'Không thể gửi email.', details: error }, { status: 500 });
        }

        console.log('Email sent successfully:', data);
        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('Notify error:', err);
        return NextResponse.json({ error: 'Lỗi server.' }, { status: 500 });
    }
}
