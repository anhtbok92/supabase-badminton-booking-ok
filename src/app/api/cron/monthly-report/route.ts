import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'victory1080@gmail.com';

interface OverageClub {
  club_id: string;
  club_name: string;
  plan_name: string;
  quota: number;
  actual_bookings: number;
  overage_count: number;
  overage_fee: number;
}

interface OverageReport {
  month: string;
  total_overage_revenue: number;
  clubs: OverageClub[];
}

/**
 * Generate HTML email content for monthly overage report
 */
function generateEmailHTML(report: OverageReport): string {
  const monthDate = new Date(report.month);
  const monthName = monthDate.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });
  
  const clubRows = report.clubs.map(club => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${club.club_name}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${club.plan_name}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${club.quota}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${club.actual_bookings}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:600;">${club.overage_count}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${club.overage_fee.toLocaleString('vi-VN')} ₫</td>
    </tr>
  `).join('');

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:24px;background-color:#f9fafb;">
      <div style="background-color:white;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color:#16a34a;margin:0 0 8px;font-size:28px;">📊 Báo cáo Overage tháng ${monthName}</h1>
        <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Báo cáo tự động từ hệ thống quản lý đặt sân</p>
        
        <div style="background-color:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin-bottom:24px;border-radius:4px;">
          <p style="margin:0;font-size:14px;color:#166534;">
            <strong style="font-size:16px;">Tổng doanh thu overage:</strong>
            <span style="font-size:24px;display:block;margin-top:8px;color:#16a34a;">
              ${report.total_overage_revenue.toLocaleString('vi-VN')} ₫
            </span>
          </p>
        </div>

        ${report.clubs.length > 0 ? `
          <h2 style="color:#374151;font-size:18px;margin:24px 0 16px;">Chi tiết các câu lạc bộ vượt quota</h2>
          <table style="width:100%;border-collapse:collapse;background-color:white;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background-color:#f9fafb;">
                <th style="padding:12px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">Câu lạc bộ</th>
                <th style="padding:12px;text-align:center;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">Gói</th>
                <th style="padding:12px;text-align:center;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">Quota</th>
                <th style="padding:12px;text-align:center;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">Thực tế</th>
                <th style="padding:12px;text-align:center;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">Vượt</th>
                <th style="padding:12px;text-align:right;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">Phí vượt</th>
              </tr>
            </thead>
            <tbody>
              ${clubRows}
            </tbody>
          </table>
        ` : `
          <div style="background-color:#f0fdf4;padding:24px;text-align:center;border-radius:8px;margin-top:24px;">
            <p style="margin:0;color:#166534;font-size:16px;">✅ Không có câu lạc bộ nào vượt quota trong tháng này</p>
          </div>
        `}

        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            Email tự động được gửi vào ngày cuối tháng từ hệ thống quản lý đặt sân cầu lông.
          </p>
          <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">
            Thời gian tạo báo cáo: ${new Date().toLocaleString('vi-VN')}
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate overage report for the previous month
 */
async function generateOverageReport(supabase: any): Promise<OverageReport> {
  // Calculate previous month
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const targetMonth = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}-01`;

  // Query all clubs with overage in the previous month
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
    throw new Error('Failed to fetch usage data');
  }

  // Get subscription and plan details for each club
  const clubsWithOverage: OverageClub[] = await Promise.all(
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

  return {
    month: targetMonth,
    total_overage_revenue: totalOverageRevenue,
    clubs: clubsWithOverage,
  };
}

/**
 * Cron endpoint to generate and send monthly overage report
 * Should be called on the last day of each month
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== Monthly overage report cron job started ===');
    console.log('Timestamp:', new Date().toISOString());

    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client with service role for cron job
    const supabase = await createClient();

    // Generate overage report for previous month
    console.log('Generating overage report...');
    const report = await generateOverageReport(supabase);
    console.log('Report generated:', {
      month: report.month,
      total_revenue: report.total_overage_revenue,
      clubs_count: report.clubs.length,
    });

    // Format HTML email
    const emailHTML = generateEmailHTML(report);

    // Send email using Resend
    console.log('Sending email to:', ADMIN_EMAIL);
    const { data, error } = await resend.emails.send({
      from: 'Hệ thống Đặt sân <no-reply@sportbooking.online>',
      to: ADMIN_EMAIL,
      subject: `📊 Báo cáo Overage tháng ${new Date(report.month).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' })}`,
      html: emailHTML,
    });

    if (error) {
      console.error('Resend error:', error);
      
      // Retry once after 5 seconds
      console.log('Retrying email send in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const { data: retryData, error: retryError } = await resend.emails.send({
        from: 'Hệ thống Đặt sân <no-reply@sportbooking.online>',
        to: ADMIN_EMAIL,
        subject: `📊 Báo cáo Overage tháng ${new Date(report.month).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' })}`,
        html: emailHTML,
      });

      if (retryError) {
        console.error('Retry failed:', retryError);
        return NextResponse.json(
          { 
            error: 'Failed to send email after retry', 
            details: retryError,
            report 
          }, 
          { status: 500 }
        );
      }

      console.log('Email sent successfully on retry:', retryData);
      return NextResponse.json({
        success: true,
        message: 'Report generated and email sent (after retry)',
        report,
        email_id: retryData?.id,
      });
    }

    console.log('Email sent successfully:', data);
    console.log('=== Monthly overage report cron job completed ===');

    return NextResponse.json({
      success: true,
      message: 'Report generated and email sent successfully',
      report,
      email_id: data?.id,
    });
  } catch (error) {
    console.error('Error in monthly report cron job:', error);
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
 * Can be removed in production or protected with admin auth
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== Manual monthly report generation ===');
    
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

    // Generate report
    const report = await generateOverageReport(supabase);
    const emailHTML = generateEmailHTML(report);

    return NextResponse.json({
      success: true,
      message: 'Report generated (not sent)',
      report,
      preview_html: emailHTML,
    });
  } catch (error) {
    console.error('Error generating manual report:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
