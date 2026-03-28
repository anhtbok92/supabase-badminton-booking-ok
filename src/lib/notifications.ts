/**
 * Notification helper functions for subscription management
 * Handles email notifications for subscription expiry and booking quota warnings
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface QuotaWarningData {
  club_name: string;
  club_owner_email: string;
  current_count: number;
  max_allowed: number;
  usage_percentage: number;
  overage_count?: number;
  overage_fee?: number;
}

/**
 * Generate HTML email for quota warning (80%, 90%, 100%)
 */
function generateQuotaWarningEmail(data: QuotaWarningData): string {
  const { club_name, current_count, max_allowed, usage_percentage, overage_count, overage_fee } = data;
  const isOverage = usage_percentage >= 100;
  const warningLevel = usage_percentage >= 100 ? 'danger' : usage_percentage >= 90 ? 'warning' : 'info';
  
  const warningColor = warningLevel === 'danger' ? '#dc2626' : warningLevel === 'warning' ? '#f59e0b' : '#3b82f6';
  const warningBg = warningLevel === 'danger' ? '#fef2f2' : warningLevel === 'warning' ? '#fffbeb' : '#eff6ff';
  const warningIcon = warningLevel === 'danger' ? '🔴' : warningLevel === 'warning' ? '⚠️' : 'ℹ️';
  
  const title = isOverage 
    ? 'Đã vượt quota booking tháng này!' 
    : `Cảnh báo: Đã sử dụng ${usage_percentage.toFixed(0)}% quota booking`;

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background-color:#f9fafb;">
      <div style="background-color:white;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="color:${warningColor};margin:0 0 8px;font-size:28px;">${warningIcon} ${title}</h1>
        <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Thông báo từ hệ thống quản lý đặt sân</p>
        
        <div style="background-color:${warningBg};border-left:4px solid ${warningColor};padding:16px;margin-bottom:24px;border-radius:4px;">
          <p style="margin:0;font-size:16px;color:${warningColor};">
            <strong>Câu lạc bộ:</strong> ${club_name}
          </p>
          <p style="margin:8px 0 0;font-size:16px;color:${warningColor};">
            <strong>Quota tháng này:</strong> ${max_allowed} bookings
          </p>
          <p style="margin:8px 0 0;font-size:16px;color:${warningColor};">
            <strong>Đã sử dụng:</strong> ${current_count} bookings
          </p>
          <p style="margin:8px 0 0;font-size:20px;color:${warningColor};font-weight:600;">
            <strong>${usage_percentage.toFixed(1)}% quota</strong>
          </p>
        </div>

        ${isOverage ? `
          <div style="background-color:#fee2e2;border-left:4px solid #dc2626;padding:16px;margin-bottom:24px;border-radius:4px;">
            <h2 style="color:#991b1b;font-size:18px;margin:0 0 12px;">💰 Phí vượt mức</h2>
            <p style="margin:0;color:#991b1b;font-size:14px;">
              <strong>Số booking vượt:</strong> ${overage_count || 0} bookings
            </p>
            <p style="margin:8px 0 0;color:#991b1b;font-size:14px;">
              <strong>Phí vượt mức:</strong> ${new Intl.NumberFormat('vi-VN').format(overage_fee || 0)} ₫
            </p>
          </div>
        ` : ''}

        <div style="background-color:#f9fafb;padding:20px;border-radius:8px;margin-bottom:24px;">
          <h2 style="color:#374151;font-size:18px;margin:0 0 12px;">
            ${isOverage ? 'Điều gì đã xảy ra?' : 'Điều gì sẽ xảy ra nếu vượt quota?'}
          </h2>
          <ul style="margin:0;padding-left:20px;color:#6b7280;">
            ${isOverage ? `
              <li style="margin-bottom:8px;">Bạn đã vượt quota ${overage_count || 0} bookings</li>
              <li style="margin-bottom:8px;">Phí vượt mức sẽ được tính vào cuối tháng</li>
              <li style="margin-bottom:8px;">Bạn vẫn có thể tiếp tục nhận booking</li>
              <li style="margin-bottom:8px;">Nâng cấp gói để tăng quota và giảm phí vượt mức</li>
            ` : `
              <li style="margin-bottom:8px;">Bạn vẫn có thể tiếp tục nhận booking</li>
              <li style="margin-bottom:8px;">Mỗi booking vượt quota sẽ bị tính phí vượt mức</li>
              <li style="margin-bottom:8px;">Phí vượt mức sẽ được tính vào cuối tháng</li>
              <li style="margin-bottom:8px;">Nâng cấp gói để tăng quota và giảm phí vượt mức</li>
            `}
          </ul>
        </div>

        <div style="text-align:center;margin:24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/admin" 
             style="display:inline-block;background-color:#16a34a;color:white;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">
            ${isOverage ? 'Nâng cấp gói ngay' : 'Xem chi tiết'}
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
 * Send quota warning email to club owner
 * @param data Quota warning data including club info and usage stats
 * @returns Promise<boolean> - true if email sent successfully
 */
export async function sendQuotaWarningEmail(data: QuotaWarningData): Promise<boolean> {
  if (!data.club_owner_email) {
    console.log(`No email for club ${data.club_name}, skipping quota warning notification`);
    return false;
  }

  const isOverage = data.usage_percentage >= 100;
  const warningLevel = data.usage_percentage >= 100 ? 'Vượt quota' : 
                       data.usage_percentage >= 90 ? 'Cảnh báo 90%' : 
                       'Cảnh báo 80%';

  try {
    const { error } = await resend.emails.send({
      from: 'Hệ thống Đặt sân <onboarding@resend.dev>',
      to: data.club_owner_email,
      subject: `${isOverage ? '🔴' : '⚠️'} ${warningLevel} booking - ${data.club_name}`,
      html: generateQuotaWarningEmail(data),
    });

    if (error) {
      console.error(`Failed to send quota warning to ${data.club_owner_email}:`, error);
      return false;
    }

    console.log(`Quota warning (${warningLevel}) sent to ${data.club_owner_email} for club ${data.club_name}`);
    return true;
  } catch (error) {
    console.error(`Error sending quota warning email:`, error);
    return false;
  }
}

/**
 * Check if quota warning should be sent based on usage percentage
 * Prevents duplicate notifications by checking thresholds
 * @param currentPercentage Current usage percentage
 * @param previousPercentage Previous usage percentage (optional)
 * @returns boolean - true if warning should be sent
 */
export function shouldSendQuotaWarning(
  currentPercentage: number, 
  previousPercentage?: number
): boolean {
  // Define thresholds
  const thresholds = [80, 90, 100];
  
  // If no previous percentage, check if we've crossed any threshold
  if (previousPercentage === undefined) {
    return thresholds.some(threshold => currentPercentage >= threshold);
  }
  
  // Check if we've crossed a new threshold
  for (const threshold of thresholds) {
    if (currentPercentage >= threshold && previousPercentage < threshold) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get the appropriate warning level based on usage percentage
 * @param usagePercentage Current usage percentage
 * @returns string - 'none', '80', '90', or '100'
 */
export function getQuotaWarningLevel(usagePercentage: number): 'none' | '80' | '90' | '100' {
  if (usagePercentage >= 100) return '100';
  if (usagePercentage >= 90) return '90';
  if (usagePercentage >= 80) return '80';
  return 'none';
}
