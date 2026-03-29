import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId là bắt buộc.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // 1. Get all clubs owned by this user
    const { data: clubs } = await supabaseAdmin
      .from('clubs')
      .select('id')
      .eq('owner_id', userId)

    // 2. Disable clubs and remove owner_id reference (FK constraint)
    if (clubs && clubs.length > 0) {
      const clubIds = clubs.map(c => c.id)
      await supabaseAdmin
        .from('clubs')
        .update({ is_active: false, verification_status: 'rejected', owner_id: null })
        .in('id', clubIds)
    }

    // 3. Remove user_id reference from bookings (FK constraint)
    await supabaseAdmin
      .from('bookings')
      .update({ user_id: null })
      .eq('user_id', userId)

    // 4. Delete auth user — public.users will cascade delete automatically
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Auth user deletion error:', authError)
      return NextResponse.json({ error: 'Không thể xóa tài khoản: ' + authError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting owner:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi server.' }, { status: 500 })
  }
}
