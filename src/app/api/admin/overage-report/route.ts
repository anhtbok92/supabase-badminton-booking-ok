import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get month parameter from query string (default to current month)
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get('month');
    
    let targetMonth: string;
    if (monthParam) {
      targetMonth = monthParam;
    } else {
      // Default to current month (first day)
      const now = new Date();
      targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    // Query all clubs with overage in the specified month
    const { data: usageData, error: usageError } = await supabase
      .from('booking_usage_tracking')
      .select(`
        club_id,
        booking_count,
        overage_count,
        overage_fee,
        clubs (
          id,
          name,
          current_subscription_id
        )
      `)
      .eq('month', targetMonth)
      .gt('overage_count', 0);

    if (usageError) {
      console.error('Error fetching usage data:', usageError);
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }

    // Get subscription and plan details for each club
    const clubsWithOverage = await Promise.all(
      (usageData || []).map(async (usage: any) => {
        const club = usage.clubs;
        
        // Get subscription details
        const { data: subscription } = await supabase
          .from('club_subscriptions')
          .select(`
            id,
            plan_id,
            subscription_plans (
              name,
              display_name,
              max_bookings_per_month
            )
          `)
          .eq('id', club.current_subscription_id)
          .single();

        return {
          club_id: club.id,
          club_name: club.name,
          plan_name: subscription?.subscription_plans?.display_name || 'N/A',
          quota: subscription?.subscription_plans?.max_bookings_per_month || 0,
          actual_bookings: usage.booking_count,
          overage_count: usage.overage_count,
          overage_fee: usage.overage_fee,
        };
      })
    );

    // Calculate total overage revenue
    const totalOverageRevenue = clubsWithOverage.reduce(
      (sum, club) => sum + club.overage_fee,
      0
    );

    return NextResponse.json({
      month: targetMonth,
      total_overage_revenue: totalOverageRevenue,
      clubs: clubsWithOverage,
    });
  } catch (error) {
    console.error('Error generating overage report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
