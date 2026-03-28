import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { clubSubscriptionUpdateSchema } from '@/app/admin/_components/schemas';
import { z } from 'zod';

/**
 * PUT /api/admin/club-subscriptions/[id]
 * Update subscription (change plan, extend, cancel)
 * Requirements: 2.2
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

    // Parse and validate request body
    const body = await request.json();
    
    let validatedData;
    try {
      validatedData = clubSubscriptionUpdateSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ.', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Check if subscription exists
    const { data: existingSubscription, error: subscriptionError } = await supabase
      .from('club_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('id', id)
      .single();

    if (subscriptionError || !existingSubscription) {
      return NextResponse.json(
        { error: 'Gói đăng ký không tồn tại.' },
        { status: 404 }
      );
    }

    // If changing plan, validate new plan exists and is active
    if (validatedData.plan_id) {
      const { data: newPlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', validatedData.plan_id)
        .single();

      if (planError || !newPlan) {
        return NextResponse.json(
          { error: 'Gói đăng ký mới không tồn tại.' },
          { status: 404 }
        );
      }

      if (!newPlan.is_active) {
        return NextResponse.json(
          { error: 'Gói đăng ký mới đã bị vô hiệu hóa.' },
          { status: 400 }
        );
      }
    }

    // Handle plan upgrade/downgrade
    // If plan_id is changing and subscription is active, we need to handle the transition
    const isPlanChange = validatedData.plan_id && validatedData.plan_id !== existingSubscription.plan_id;
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.plan_id) {
      updateData.plan_id = validatedData.plan_id;
    }

    if (validatedData.billing_cycle) {
      updateData.billing_cycle = validatedData.billing_cycle;
      
      // Recalculate end_date if billing_cycle changes
      const startDate = new Date(existingSubscription.start_date);
      let newEndDate = new Date(startDate);
      
      if (validatedData.billing_cycle === 'monthly') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else if (validatedData.billing_cycle === 'yearly') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }
      
      updateData.end_date = newEndDate.toISOString().split('T')[0];
    }

    if (validatedData.end_date !== undefined) {
      updateData.end_date = validatedData.end_date;
    }

    if (validatedData.is_active !== undefined) {
      updateData.is_active = validatedData.is_active;
      
      // If deactivating subscription, update club status
      if (!validatedData.is_active && existingSubscription.is_active) {
        // Check if there's a FREE plan to downgrade to
        const { data: freePlan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('name', 'FREE')
          .single();

        if (freePlan) {
          // Create a new FREE subscription
          const startDate = new Date().toISOString().split('T')[0];
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 3); // 3-month trial
          
          const { data: freeSubscription } = await supabase
            .from('club_subscriptions')
            .insert({
              club_id: existingSubscription.club_id,
              plan_id: freePlan.id,
              billing_cycle: 'monthly',
              start_date: startDate,
              end_date: endDate.toISOString().split('T')[0],
              is_active: true,
              auto_renew: false,
            })
            .select()
            .single();

          if (freeSubscription) {
            // Update club to point to new FREE subscription
            await supabase
              .from('clubs')
              .update({
                current_subscription_id: freeSubscription.id,
                subscription_status: 'active',
              })
              .eq('id', existingSubscription.club_id);
          }
        } else {
          // No FREE plan found, just update club status
          await supabase
            .from('clubs')
            .update({
              current_subscription_id: null,
              subscription_status: 'expired',
            })
            .eq('id', existingSubscription.club_id);
        }
      }
    }

    if (validatedData.auto_renew !== undefined) {
      updateData.auto_renew = validatedData.auto_renew;
    }

    // Update subscription
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('club_subscriptions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating club subscription:', updateError);
      return NextResponse.json(
        { error: 'Không thể cập nhật gói đăng ký.' },
        { status: 500 }
      );
    }

    // If this is still the active subscription and plan changed, update club's subscription_id
    if (isPlanChange && updatedSubscription.is_active) {
      const { error: updateClubError } = await supabase
        .from('clubs')
        .update({
          current_subscription_id: updatedSubscription.id,
        })
        .eq('id', existingSubscription.club_id);

      if (updateClubError) {
        console.error('Error updating club subscription_id:', updateClubError);
      }
    }

    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('Error in PUT /api/admin/club-subscriptions/[id]:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi server.' },
      { status: 500 }
    );
  }
}
