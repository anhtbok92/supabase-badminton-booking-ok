import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { subscriptionPlanSchema } from '@/app/admin/_components/schemas';
import { z } from 'zod';

/**
 * PUT /api/admin/subscription-plans/[id]
 * Update an existing subscription plan
 * Requirements: 1.4, 9.4
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Validate plan ID format
    if (!id || id.length === 0) {
      return NextResponse.json(
        { error: 'Plan ID không hợp lệ.' },
        { status: 400 }
      );
    }

    // Check if plan exists
    const { data: existingPlan, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPlan) {
      return NextResponse.json(
        { error: 'Không tìm thấy gói đăng ký.' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Make schema partial for updates
    const updateSchema = subscriptionPlanSchema.partial();
    
    let validatedData;
    try {
      validatedData = updateSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ.', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // If name is being changed, check for conflicts
    if (validatedData.name && validatedData.name !== existingPlan.name) {
      const { data: conflictPlan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', validatedData.name)
        .neq('id', id)
        .single();

      if (conflictPlan) {
        return NextResponse.json(
          { error: `Gói đăng ký với tên "${validatedData.name}" đã tồn tại.` },
          { status: 409 }
        );
      }
    }

    // Update subscription plan
    const { data: updatedPlan, error: updateError } = await supabase
      .from('subscription_plans')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription plan:', updateError);
      return NextResponse.json(
        { error: 'Không thể cập nhật gói đăng ký.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    console.error('Error in PUT /api/admin/subscription-plans/[id]:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi server.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/subscription-plans/[id]
 * Delete a subscription plan (only if no active subscriptions exist)
 * Requirements: 1.4, 9.4
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Validate plan ID format
    if (!id || id.length === 0) {
      return NextResponse.json(
        { error: 'Plan ID không hợp lệ.' },
        { status: 400 }
      );
    }

    // Check if plan exists
    const { data: existingPlan, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPlan) {
      return NextResponse.json(
        { error: 'Không tìm thấy gói đăng ký.' },
        { status: 404 }
      );
    }

    // Check if there are any active subscriptions using this plan
    const { data: activeSubscriptions, error: subscriptionError } = await supabase
      .from('club_subscriptions')
      .select('id')
      .eq('plan_id', id)
      .eq('is_active', true);

    if (subscriptionError) {
      console.error('Error checking active subscriptions:', subscriptionError);
      return NextResponse.json(
        { error: 'Không thể kiểm tra gói đăng ký đang sử dụng.' },
        { status: 500 }
      );
    }

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Không thể xóa gói đăng ký đang được sử dụng.',
          details: `Có ${activeSubscriptions.length} câu lạc bộ đang sử dụng gói này.`
        },
        { status: 409 }
      );
    }

    // Delete the subscription plan
    const { error: deleteError } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting subscription plan:', deleteError);
      return NextResponse.json(
        { error: 'Không thể xóa gói đăng ký.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Đã xóa gói đăng ký thành công.'
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/subscription-plans/[id]:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi server.' },
      { status: 500 }
    );
  }
}
