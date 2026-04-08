import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();
    if (!userId || !password) {
      return NextResponse.json({ error: 'userId và password là bắt buộc.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      return NextResponse.json({ error: 'Không thể đặt lại mật khẩu.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi server.' }, { status: 500 });
  }
}
