import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { subscriptionPlanSchema } from '@/app/admin/_components/schemas';
import { z } from 'zod';

/**
 * GET /api/admin/subscription-plans
 * List all subscription plans
 * Requirements: 1.3, 9.1
 */
export async function GET() {
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

    // Fetch all subscription plans
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('created_at', { ascending: true });

    if (plansError) {
      console.error('Error fetching subscription plans:', plansError);
      return NextResponse.json(
        { error: 'Không thể tải danh sách gói đăng ký.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error in GET /api/admin/subscription-plans:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi server.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/subscription-plans
 * Create a new subscription plan
 * Requirements: 1.3, 9.1
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
      validatedData = subscriptionPlanSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ.', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Check if plan with same name already exists
    const { data: existingPlan, error: checkError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', validatedData.name)
      .single();

    if (existingPlan) {
      return NextResponse.json(
        { error: `Gói đăng ký với tên "${validatedData.name}" đã tồn tại.` },
        { status: 409 }
      );
    }

    // Create new subscription plan
    const { data: newPlan, error: insertError } = await supabase
      .from('subscription_plans')
      .insert({
        name: validatedData.name,
        display_name: validatedData.display_name,
        max_courts: validatedData.max_courts,
        max_bookings_per_month: validatedData.max_bookings_per_month,
        monthly_price: validatedData.monthly_price,
        yearly_price: validatedData.yearly_price,
        overage_fee_per_booking: validatedData.overage_fee_per_booking,
        is_active: validatedData.is_active,
        features: validatedData.features || {},
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating subscription plan:', insertError);
      return NextResponse.json(
        { error: 'Không thể tạo gói đăng ký.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan: newPlan }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/subscription-plans:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi server.' },
      { status: 500 }
    );
  }
}
