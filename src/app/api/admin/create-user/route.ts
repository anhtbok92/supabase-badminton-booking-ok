import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role, managedClubIds } = body

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password và role là bắt buộc.' },
        { status: 400 }
      )
    }

    if (!['club_owner', 'staff'].includes(role)) {
      return NextResponse.json(
        { error: 'Role phải là club_owner hoặc staff.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Create auth user via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      let message = 'Không thể tạo tài khoản.'
      if (authError.message?.includes('already been registered')) {
        message = 'Email này đã được sử dụng.'
      }
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const userId = authData.user.id

    // Insert user profile into users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email,
        role,
        managed_club_ids: managedClubIds || [],
      })

    if (profileError) {
      // Attempt to clean up the auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Không thể tạo hồ sơ người dùng.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ userId, email, role })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi server.' },
      { status: 500 }
    )
  }
}
