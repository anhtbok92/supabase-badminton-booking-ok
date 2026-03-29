import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const resend = new Resend(process.env.RESEND_API_KEY);

function generatePassword(length = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fullName, email, phoneNumber, clubName, address, courtCount, note, planName } = body;

        console.log('Register owner request:', { fullName, email, clubName, planName, courtCount });

        // Validate required fields
        if (!fullName || !email || !phoneNumber || !clubName || !address || !courtCount || !planName) {
            return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
        }

        // Validate courtCount
        if (courtCount < 1 || courtCount > 30) {
            return NextResponse.json({ error: 'Số lượng sân phải từ 1 đến 30' }, { status: 400 });
        }

        // Generate password
        const password = generatePassword();

        // 1. Create user account
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                phone: phoneNumber,
            },
        });

        if (userError) {
            console.error('User creation error:', userError);
            return NextResponse.json({ error: 'Không thể tạo tài khoản: ' + userError.message }, { status: 500 });
        }

        const userId = userData.user.id;

        // 2. Create user profile in public.users with club_owner role
        // This is REQUIRED - public.users is the app's user table referenced by RLS policies
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: userId,
                email: email,
                phone: phoneNumber,
                role: 'club_owner',
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // Rollback: delete the auth user since profile creation failed
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return NextResponse.json({ error: 'Không thể tạo hồ sơ người dùng: ' + profileError.message }, { status: 500 });
        }

        // 3. Get selected plan
        const { data: plan, error: planError } = await supabaseAdmin
            .from('subscription_plans')
            .select('*')
            .eq('name', planName)
            .single();

        if (planError || !plan) {
            console.error('Plan fetch error:', planError);
            return NextResponse.json({ error: 'Không tìm thấy gói dịch vụ' }, { status: 500 });
        }

        // 4. Create club
        const defaultPricing = {
            weekday: [{ timeRange: ['05:00', '24:00'], price: 40000 }],
            weekend: [{ timeRange: ['05:00', '24:00'], price: 40000 }]
        };

        const { data: club, error: clubError } = await supabaseAdmin
            .from('clubs')
            .insert({
                name: clubName,
                address,
                phone: phoneNumber,
                club_type: 'other',
                is_active: true, // Active immediately
                verification_status: 'approved',
                owner_name: fullName,
                owner_phone: phoneNumber,
                number_of_courts: courtCount,
                description: note || null,
                owner_id: userId,
                pricing: defaultPricing,
            })
            .select()
            .single();

        if (clubError) {
            console.error('Club creation error:', clubError);
            return NextResponse.json({ error: 'Không thể tạo câu lạc bộ' }, { status: 500 });
        }

        // 5. Create subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

        const { data: subscription, error: subscriptionError } = await supabaseAdmin
            .from('club_subscriptions')
            .insert({
                club_id: club.id,
                plan_id: plan.id,
                billing_cycle: 'monthly',
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                is_active: true,
                auto_renew: false,
            })
            .select()
            .single();

        if (subscriptionError) {
            console.error('Subscription creation error:', subscriptionError);
        } else {
            // Update club with subscription
            await supabaseAdmin
                .from('clubs')
                .update({
                    current_subscription_id: subscription.id,
                    subscription_status: 'active',
                })
                .eq('id', club.id);
        }

        // 6. Update user profile with managed club
        await supabaseAdmin
            .from('users')
            .update({
                managed_club_ids: [club.id],
            })
            .eq('id', userId);

        // 7. Create courts automatically
        const courts = [];
        for (let i = 1; i <= courtCount; i++) {
            courts.push({
                club_id: club.id,
                name: `Sân ${i}`,
                order: i,
            });
        }

        if (courts.length > 0) {
            const { error: courtsError } = await supabaseAdmin
                .from('courts')
                .insert(courts);

            if (courtsError) {
                console.error('Courts creation error:', courtsError);
            } else {
                console.log(`Successfully created ${courts.length} courts for club ${club.id}`);
            }
        }

        // 8. Send onboarding email
        try {
            const { error: emailError } = await resend.emails.send({
                from: 'Sport Booking <no-reply@sportbooking.online>',
                to: email,
                subject: 'Chào mừng đến với Sport Booking - Thông tin đăng nhập',
                html: `
                    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f4faff;">
                        <div style="background:white;padding:32px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                            <h1 style="color:#006e1c;margin:0 0 24px;font-size:28px;">🎾 Chào mừng đến với Sport Booking!</h1>
                            
                            <p style="color:#001f2a;font-size:16px;line-height:1.6;margin-bottom:24px;">
                                Xin chào <strong>${fullName}</strong>,
                            </p>
                            
                            <p style="color:#3f4a3c;font-size:14px;line-height:1.6;margin-bottom:24px;">
                                Tài khoản chủ sân của bạn đã được tạo thành công! Dưới đây là thông tin đăng nhập của bạn:
                            </p>
                            
                            <div style="background:#e6f6ff;padding:20px;border-radius:8px;margin-bottom:24px;">
                                <table style="width:100%;">
                                    <tr>
                                        <td style="padding:8px 0;color:#3f4a3c;font-size:14px;">🏢 Câu lạc bộ:</td>
                                        <td style="padding:8px 0;color:#001f2a;font-weight:600;font-size:14px;">${clubName}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;color:#3f4a3c;font-size:14px;">📧 Email/Username:</td>
                                        <td style="padding:8px 0;color:#001f2a;font-weight:600;font-size:14px;">${email}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;color:#3f4a3c;font-size:14px;">🔑 Mật khẩu:</td>
                                        <td style="padding:8px 0;color:#006e1c;font-weight:700;font-size:16px;font-family:monospace;">${password}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;color:#3f4a3c;font-size:14px;">📦 Gói dịch vụ:</td>
                                        <td style="padding:8px 0;color:#001f2a;font-weight:600;font-size:14px;">${plan.display_name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:8px 0;color:#3f4a3c;font-size:14px;">🎾 Số sân:</td>
                                        <td style="padding:8px 0;color:#001f2a;font-weight:600;font-size:14px;">${courtCount} sân</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="text-align:center;margin:32px 0;">
                                <a href="https://app.sportbooking.online/admin" style="display:inline-block;background:#006e1c;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
                                    Đăng nhập vào trang quản trị
                                </a>
                            </div>
                            
                            <div style="background:#fff9e6;border-left:4px solid #ff9800;padding:16px;margin-bottom:24px;">
                                <p style="margin:0;color:#653900;font-size:14px;line-height:1.6;">
                                    <strong>⚠️ Lưu ý bảo mật:</strong> Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên để bảo mật tài khoản.
                                </p>
                            </div>
                            
                            <h2 style="color:#006e1c;font-size:20px;margin:32px 0 16px;">🚀 Hệ thống đã sẵn sàng</h2>
                            
                            <p style="color:#3f4a3c;font-size:14px;line-height:1.6;margin-bottom:24px;">
                                Để giúp bạn bắt đầu nhanh chóng, chúng tôi đã <strong>tự động khởi tạo ${courtCount} sân</strong> (từ Sân 1 đến Sân ${courtCount}) cho câu lạc bộ của bạn.
                            </p>

                            <h2 style="color:#006e1c;font-size:20px;margin:32px 0 16px;">📚 Hướng dẫn sử dụng</h2>
                            
                            <ol style="color:#3f4a3c;font-size:14px;line-height:1.8;padding-left:20px;">
                                <li><strong>Kiểm tra sân:</strong> Các sân từ 1 đến ${courtCount} đã được tạo sẵn. Bạn có thể thay đổi tên hoặc thêm mô tả trong mục Quản lý sân.</li>
                                <li><strong>Thiết lập giá:</strong> Mặc định giá là 40.000đ/giờ. Hãy cập nhật bảng giá theo khung giờ của bạn.</li>
                                <li><strong>Quản lý lịch đặt:</strong> Xem, xác nhận hoặc hủy booking của khách hàng tại Dashboard.</li>
                                <li><strong>Báo cáo:</strong> Theo dõi doanh thu và thống kê sử dụng sân hàng ngày.</li>
                            </ol>
                            
                            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;">
                                <p style="color:#3f4a3c;font-size:13px;line-height:1.6;margin:0;">
                                    Nếu bạn cần hỗ trợ, vui lòng liên hệ:<br/>
                                    📧 Email: <a href="mailto:support@sportbooking.online" style="color:#006e1c;">support@sportbooking.online</a><br/>
                                    📞 Hotline: 0123 456 789
                                </p>
                            </div>
                            
                            <p style="color:#999;font-size:12px;text-align:center;margin-top:24px;">
                                © 2024 Sport Booking. All rights reserved.
                            </p>
                        </div>
                    </div>
                `,
            });

            if (emailError) {
                console.error('Email sending error:', emailError);
            }
        } catch (emailError) {
            console.error('Email error:', emailError);
        }

        return NextResponse.json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                clubId: club.id,
                email,
            }
        });

    } catch (error: any) {
        console.error('Register owner error:', error);
        return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500 });
    }
}
