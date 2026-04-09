import { createAdminClient } from '@/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron Job: Auto-cancel past events
 * Queries events with status 'active' and event_date < today,
 * then updates their status to 'cancelled'.
 *
 * Recommended to run daily.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Cancel past events cron job started ===');
    console.log('Timestamp:', new Date().toISOString());

    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get today's date in YYYY-MM-DD format (consistent with event_date storage)
    const today = new Date().toISOString().split('T')[0];

    // Update all active events whose date has passed
    const { data: updated, error } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('status', 'active')
      .lt('event_date', today)
      .select('id, event_name, event_date, club_id');

    if (error) {
      console.error('Error cancelling past events:', error);
      return NextResponse.json(
        { error: 'Failed to cancel past events', details: error },
        { status: 500 }
      );
    }

    const cancelledCount = updated?.length ?? 0;
    console.log(`Cancelled ${cancelledCount} past events`);

    if (cancelledCount > 0) {
      console.log('Cancelled events:', updated);
    }

    console.log('=== Cancel past events cron job completed ===');

    return NextResponse.json({
      success: true,
      message: `Cancelled ${cancelledCount} past events`,
      cancelled_count: cancelledCount,
      cancelled_events: updated,
    });
  } catch (error) {
    console.error('Error in cancel past events cron job:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual triggering (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { createClient } = await import('@/supabase/server');
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Run the same cancel logic using admin client
    const adminSupabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: updated, error } = await adminSupabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('status', 'active')
      .lt('event_date', today)
      .select('id, event_name, event_date, club_id');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to cancel past events', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cancelled ${updated?.length ?? 0} past events (manual trigger)`,
      cancelled_count: updated?.length ?? 0,
      cancelled_events: updated,
    });
  } catch (error) {
    console.error('Error in manual cancel past events:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
