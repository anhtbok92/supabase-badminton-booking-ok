import { NextRequest, NextResponse } from 'next/server';
import { sendQuotaWarningEmail, shouldSendQuotaWarning, getQuotaWarningLevel } from '@/lib/notifications';

interface QuotaWarningRequest {
  club_name: string;
  club_owner_email: string;
  current_count: number;
  max_allowed: number;
  usage_percentage: number;
  overage_count?: number;
  overage_fee?: number;
  previous_percentage?: number;
}

/**
 * POST endpoint to send quota warning emails
 * Called after booking creation when quota thresholds are reached
 */
export async function POST(req: NextRequest) {
  try {
    console.log('=== Quota warning notification API called ===');
    
    const body: QuotaWarningRequest = await req.json();
    const { 
      club_name, 
      club_owner_email, 
      current_count, 
      max_allowed, 
      usage_percentage,
      overage_count,
      overage_fee,
      previous_percentage 
    } = body;

    // Validate required fields
    if (!club_name || !club_owner_email || current_count === undefined || max_allowed === undefined || usage_percentage === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    console.log('Quota warning request:', {
      club_name,
      club_owner_email,
      current_count,
      max_allowed,
      usage_percentage: usage_percentage.toFixed(1) + '%',
    });

    // Check if we should send notification based on thresholds
    const shouldSend = shouldSendQuotaWarning(usage_percentage, previous_percentage);
    
    if (!shouldSend) {
      console.log('Quota warning not needed - threshold not crossed');
      return NextResponse.json({
        success: true,
        message: 'Notification not needed',
        threshold_crossed: false,
      });
    }

    const warningLevel = getQuotaWarningLevel(usage_percentage);
    console.log(`Sending ${warningLevel}% quota warning to ${club_owner_email}`);

    // Send the email
    const emailSent = await sendQuotaWarningEmail({
      club_name,
      club_owner_email,
      current_count,
      max_allowed,
      usage_percentage,
      overage_count,
      overage_fee,
    });

    if (!emailSent) {
      console.error('Failed to send quota warning email');
      return NextResponse.json(
        { 
          error: 'Failed to send email notification',
          success: false,
        }, 
        { status: 500 }
      );
    }

    console.log('Quota warning email sent successfully');
    return NextResponse.json({
      success: true,
      message: 'Quota warning email sent',
      threshold_crossed: true,
      warning_level: warningLevel,
    });
  } catch (error) {
    console.error('Error in quota warning notification:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
