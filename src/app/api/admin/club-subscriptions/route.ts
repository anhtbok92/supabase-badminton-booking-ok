import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { clubSubscriptionSchema } from '@/app/admin/_components/schemas';
import { z } from 'zod';

/**
 * POST /api/admin/club-subscriptions
 * Assign subscription to club
 * Requirements: 2.1
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    let validatedData;
    try {
      validatedData = clubSubscriptionSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ.', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Check if club exists
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('id', validatedData.club_id)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: 'Câu lạc bộ không tồn tại.' },
        { status: 404 }
      );
    }

    // Check if plan exists and is active
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', validatedData.plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Gói đăng ký không tồn tại.' },
        { status: 404 }
      );
    }

    if (!plan.is_active) {
      return NextResponse.json(
        { error: 'Gói đăng ký này đã bị vô hiệu hóa.' },
        { status: 400 }
      );
    }

    // Check if club already has an active subscription
    const { data: existingSubscription, error: existingError } = await supabase
      .from('club_subscriptions')
      .select('id')
      .eq('club_id', validatedData.club_id)
      .eq('is_active', true)
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Câu lạc bộ đã có gói đăng ký đang hoạt động. Vui lòng hủy gói hiện tại trước.' },
        { status: 409 }
      );
    }

    // Calculate end_date based on billing_cycle
    const startDate = new Date(validatedData.start_date);
    let endDate = new Date(startDate);
    
    if (validatedData.billing_cycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (validatedData.billing_cycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Format end_date as YYYY-MM-DD
    const endDateString = endDate.toISOString().split('T')[0];

    // Create new subscription
    const { data: newSubscription, error: insertError } = await supabase
      .from('club_subscriptions')
      .insert({
        club_id: validatedData.club_id,
        plan_id: validatedData.plan_id,
        billing_cycle: validatedData.billing_cycle,
        start_date: validatedData.start_date,
        end_date: endDateString,
        is_active: true,
        auto_renew: validatedData.auto_renew,
      })
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .single();

    if (insertError) {
      console.error('Error creating club subscription:', insertError);
      return NextResponse.json(
        { error: 'Không thể tạo gói đăng ký cho câu lạc bộ.' },
        { status: 500 }
      );
    }

    // Update clubs.current_subscription_id
    const { error: updateClubError } = await supabase
      .from('clubs')
      .update({
        current_subscription_id: newSubscription.id,
        subscription_status: 'active',
      })
      .eq('id', validatedData.club_id);

    if (updateClubError) {
      console.error('Error updating club subscription_id:', updateClubError);
      // Rollback: delete the subscription we just created
      await supabase
        .from('club_subscriptions')
        .delete()
        .eq('id', newSubscription.id);
      
      return NextResponse.json(
        { error: 'Không thể cập nhật thông tin câu lạc bộ.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription: newSubscription }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/club-subscriptions:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi server.' },
      { status: 500 }
    );
  }
}
