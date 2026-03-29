import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ExpiringSubscription {
  subscription_id: string;
  club_id: string;
  club_name: string;
  club_owner_email: string;
  plan_name: string;
  end_date: string;
  days_until_expiry: number;
}

interface ExpiredSubscription {
  subscription_id: string;
  club_id: string;
  club_name: string;
  club_owner_email: string;
  plan_name: string;
  end_date: string;
  days_since_expiry: number;
}

interface DowngradeResult {
  club_id: string;
  club_name: string;
  success: boolean;
  message: string;
  old_subscription_id?: string;
  new_subscription_id?: string;
}

interface ProcessResult {
  total_expiring: number;
  total_expired: number;
  total_downgraded: number;
  expiring_clubs: ExpiringSubscription[];
  expired_clubs: ExpiredSubscription[];
  downgrade_results: DowngradeResult[];
}

/**
 * Generate HTML email for expiring subscription warning (7 days)
 */
function generateExpiringWarningEmail(subscription: ExpiringSubscription): string {
  const endDate = new Date(subscription.end_date);
  const formattedDate = endDate.toLocaleDateString('vi-VN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background-color:#f9fafb;">
      <div style="background-color:white;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color:#f59e0b;margin:0 0 8px;font-size:28px;">⚠️ Cảnh báo: Gói đăng ký sắp hết hạn</h1>
        <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Thông báo từ hệ thống quản lý đặt sân</p>
        
        <div style="background-color:#fffbeb;border-left:4px solid #f59e0b;padding:16px;margin-bottom:24px;border-radius:4px;">
          <p style="margin:0;font-size:16px;color:#92400e;">
            <strong>Câu lạc bộ:</strong> ${subscription.club_name}
          </p>
          <p style="margin:8px 0 0;font-size:16px;color:#92400e;">
            <strong>Gói hiện tại:</strong> ${subscription.plan_name}
          </p>
          <p style="margin:8px 0 0;font-size:16px;color:#92400e;">
            <strong>Ngày hết hạn:</strong> ${formattedDate}
          </p>
          <p style="margin:8px 0 0;font-size:20px;color:#f59e0b;font-weight:600;">
            <strong>Còn ${subscription.days_until_expiry} ngày</strong>
          </p>
        </div>

        <div style="background-color:#f9fafb;padding:20px;border-radius:8px;margin-bottom:24px;">
          <h2 style="color:#374151;font-size:18px;margin:0 0 12px;">Điều gì sẽ xảy ra khi hết hạn?</h2>
          <ul style="margin:0;padding-left:20px;color:#6b7280;">
            <li style="margin-bottom:8px;">Gói đăng ký sẽ tự động chuyển về <strong>Gói Miễn phí</strong></li>
            <li style="margin-bottom:8px;">Giới hạn số sân: <strong>3 sân</strong></li>
            <li style="margin-bottom:8px;">Giới hạn booking: <strong>100 booking/tháng</strong></li>
            <li style="margin-bottom:8px;">Các tính năng nâng cao sẽ bị tắt</li>
          </ul>
        </div>

        <div style="text-align:center;margin:24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/admin" 
             style="display:inline-block;background-color:#16a34a;color:white;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">
            Gia hạn ngay
          </a>
        </div>

        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            Email tự động được gửi từ hệ thống quản lý đặt sân cầu lông.
          </p>
          <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">
            Nếu bạn có câu hỏi, vui lòng liên hệ: victory1080@gmail.com
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate HTML email for expired subscription notification
 */
function generateExpiredNotificationEmail(subscription: ExpiredSubscription): string {
  const endDate = new Date(subscription.end_date);
  const formattedDate = endDate.toLocaleDateString('vi-VN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background-color:#f9fafb;">
      <div style="background-color:white;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color:#dc2626;margin:0 0 8px;font-size:28px;">🔴 Gói đăng ký đã hết hạn</h1>
        <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Thông báo từ hệ thống quản lý đặt sân</p>
        
        <div style="background-color:#fef2f2;border-left:4px solid #dc2626;padding:16px;margin-bottom:24px;border-radius:4px;">
          <p style="margin:0;font-size:16px;color:#991b1b;">
            <strong>Câu lạc bộ:</strong> ${subscription.club_name}
          </p>
          <p style="margin:8px 0 0;font-size:16px;color:#991b1b;">
            <strong>Gói trước đó:</strong> ${subscription.plan_name}
          </p>
          <p style="margin:8px 0 0;font-size:16px;color:#991b1b;">
            <strong>Ngày hết hạn:</strong> ${formattedDate}
          </p>
          <p style="margin:8px 0 0;font-size:20px;color:#dc2626;font-weight:600;">
            <strong>Đã hết hạn ${subscription.days_since_expiry} ngày trước</strong>
          </p>
        </div>

        <div style="background-color:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin-bottom:24px;border-radius:4px;">
          <h2 style="color:#166534;font-size:18px;margin:0 0 12px;">✅ Đã chuyển sang Gói Miễn phí</h2>
          <p style="margin:0;color:#166534;font-size:14px;">
            Tài khoản của bạn đã được tự động chuyển sang Gói Miễn phí với thời hạn 3 tháng.
          </p>
        </div>

        <div style="background-color:#f9fafb;padding:20px;border-radius:8px;margin-bottom:24px;">
          <h2 style="color:#374151;font-size:18px;margin:0 0 12px;">Giới hạn Gói Miễn phí:</h2>
          <ul style="margin:0;padding-left:20px;color:#6b7280;">
            <li style="margin-bottom:8px;">Số sân tối đa: <strong>3 sân</strong></li>
            <li style="margin-bottom:8px;">Booking mỗi tháng: <strong>100 booking</strong></li>
            <li style="margin-bottom:8px;">Hỗ trợ: <strong>Email</strong></li>
            <li style="margin-bottom:8px;">Không có phí vượt mức</li>
          </ul>
        </div>

        <div style="text-align:center;margin:24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/admin" 
             style="display:inline-block;background-color:#16a34a;color:white;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">
            Nâng cấp gói ngay
          </a>
        </div>

        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            Email tự động được gửi từ hệ thống quản lý đặt sân cầu lông.
          </p>
          <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">
            Nếu bạn có câu hỏi, vui lòng liên hệ: victory1080@gmail.com
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Send expiring warning email to club owner
 */
async function sendExpiringWarningEmail(subscription: ExpiringSubscription): Promise<boolean> {
  if (!subscription.club_owner_email) {
    console.log(`No email for club ${subscription.club_name}, skipping notification`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Hệ thống Đặt sân <no-reply@sportbooking.online>',
      to: subscription.club_owner_email,
      subject: `⚠️ Gói đăng ký sắp hết hạn - ${subscription.club_name}`,
      html: generateExpiringWarningEmail(subscription),
    });

    if (error) {
      console.error(`Failed to send expiring warning to ${subscription.club_owner_email}:`, error);
      return false;
    }

    console.log(`Expiring warning sent to ${subscription.club_owner_email} for club ${subscription.club_name}`);
    return true;
  } catch (error) {
    console.error(`Error sending expiring warning email:`, error);
    return false;
  }
}

/**
 * Send expired notification email to club owner
 */
async function sendExpiredNotificationEmail(subscription: ExpiredSubscription): Promise<boolean> {
  if (!subscription.club_owner_email) {
    console.log(`No email for club ${subscription.club_name}, skipping notification`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Hệ thống Đặt sân <no-reply@sportbooking.online>',
      to: subscription.club_owner_email,
      subject: `🔴 Gói đăng ký đã hết hạn - ${subscription.club_name}`,
      html: generateExpiredNotificationEmail(subscription),
    });

    if (error) {
      console.error(`Failed to send expired notification to ${subscription.club_owner_email}:`, error);
      return false;
    }

    console.log(`Expired notification sent to ${subscription.club_owner_email} for club ${subscription.club_name}`);
    return true;
  } catch (error) {
    console.error(`Error sending expired notification email:`, error);
    return false;
  }
}

/**
 * Cron endpoint to check and process subscription expiries
 * Should be called daily
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Subscription expiry check cron job started ===');
    console.log('Timestamp:', new Date().toISOString());

    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client with service role for cron job
    const supabase = await createClient();

    // Process all subscription expiries
    console.log('Processing subscription expiries...');
    const { data, error } = await supabase.rpc('process_all_subscription_expiries');

    if (error) {
      console.error('Error processing subscription expiries:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process subscription expiries', 
          details: error 
        },
        { status: 500 }
      );
    }

    const result = data[0] as ProcessResult;
    console.log('Processing complete:', {
      expiring: result.total_expiring,
      expired: result.total_expired,
      downgraded: result.total_downgraded,
    });

    // Send expiring warning emails (7 days before expiry)
    let expiringEmailsSent = 0;
    if (result.expiring_clubs && result.expiring_clubs.length > 0) {
      console.log(`Sending ${result.expiring_clubs.length} expiring warning emails...`);
      
      for (const subscription of result.expiring_clubs) {
        const sent = await sendExpiringWarningEmail(subscription);
        if (sent) expiringEmailsSent++;
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Send expired notification emails
    let expiredEmailsSent = 0;
    if (result.expired_clubs && result.expired_clubs.length > 0) {
      console.log(`Sending ${result.expired_clubs.length} expired notification emails...`);
      
      for (const subscription of result.expired_clubs) {
        const sent = await sendExpiredNotificationEmail(subscription);
        if (sent) expiredEmailsSent++;
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('Email notifications sent:', {
      expiring_warnings: expiringEmailsSent,
      expired_notifications: expiredEmailsSent,
    });

    console.log('=== Subscription expiry check cron job completed ===');

    return NextResponse.json({
      success: true,
      message: 'Subscription expiry check completed',
      summary: {
        total_expiring: result.total_expiring,
        total_expired: result.total_expired,
        total_downgraded: result.total_downgraded,
        expiring_emails_sent: expiringEmailsSent,
        expired_emails_sent: expiredEmailsSent,
      },
      details: {
        expiring_clubs: result.expiring_clubs,
        expired_clubs: result.expired_clubs,
        downgrade_results: result.downgrade_results,
      },
    });
  } catch (error) {
    console.error('Error in subscription expiry check cron job:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual testing
 * Requires admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== Manual subscription expiry check ===');
    
    const supabase = await createClient();

    // Check if user is admin
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

    // Process subscription expiries (without sending emails)
    const { data, error } = await supabase.rpc('process_all_subscription_expiries');

    if (error) {
      console.error('Error processing subscription expiries:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process subscription expiries', 
          details: error 
        },
        { status: 500 }
      );
    }

    const result = data[0] as ProcessResult;

    return NextResponse.json({
      success: true,
      message: 'Subscription expiry check completed (emails not sent in manual mode)',
      summary: {
        total_expiring: result.total_expiring,
        total_expired: result.total_expired,
        total_downgraded: result.total_downgraded,
      },
      details: {
        expiring_clubs: result.expiring_clubs,
        expired_clubs: result.expired_clubs,
        downgrade_results: result.downgrade_results,
      },
    });
  } catch (error) {
    console.error('Error in manual subscription expiry check:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

