# Cron Jobs Setup Guide

## Overview

This document describes the automated cron jobs configured for the subscription management system.

## 1. Monthly Overage Report

### Purpose
Automatically generates and emails a monthly report of clubs that exceeded their booking quota, including overage fees and total revenue.

### Configuration

#### Vercel Cron Job
The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/monthly-report",
      "schedule": "0 23 28-31 * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 23 28-31 * *` - Runs at 23:00 (11 PM) on days 28-31 of every month
- This ensures the job runs on the last day of the month regardless of month length
- Vercel will only execute once per month (on the actual last day)

#### Environment Variables

Add to your `.env` file:

```bash
# Required for email sending
RESEND_API_KEY=your-resend-api-key

# Optional: Secure cron endpoint (recommended for production)
CRON_SECRET=your-random-secret-key
```

**Generating CRON_SECRET:**
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### API Endpoint

**Endpoint:** `POST /api/cron/monthly-report`

**Authentication:**
- If `CRON_SECRET` is set, requires `Authorization: Bearer <CRON_SECRET>` header
- Vercel automatically adds this header when calling cron jobs

**Response:**
```json
{
  "success": true,
  "message": "Report generated and email sent successfully",
  "report": {
    "month": "2025-01-01",
    "total_overage_revenue": 150000,
    "clubs": [
      {
        "club_id": "uuid",
        "club_name": "CLB ABC",
        "plan_name": "Gói Cơ bản",
        "quota": 1000,
        "actual_bookings": 1050,
        "overage_count": 50,
        "overage_fee": 100000
      }
    ]
  },
  "email_id": "email-id-from-resend"
}
```

### Error Handling

The cron job includes:

1. **Automatic Retry:** If email sending fails, it retries once after 5 seconds
2. **Detailed Logging:** All operations are logged to console for debugging
3. **Error Response:** Returns detailed error information for troubleshooting

**Error Scenarios:**
- Database connection failure
- Email service unavailable
- Invalid data format
- Missing environment variables

### Email Content

The email includes:
- Month and year of the report
- Total overage revenue (highlighted)
- Detailed table of clubs with overage:
  - Club name
  - Subscription plan
  - Booking quota
  - Actual bookings
  - Overage count
  - Overage fee in VND
- Timestamp of report generation

**Email Recipient:** victory1080@gmail.com (configured in code)

### Manual Testing

For testing purposes, a GET endpoint is available:

**Endpoint:** `GET /api/cron/monthly-report`

**Authentication:** Requires admin user authentication

**Response:**
```json
{
  "success": true,
  "message": "Report generated (not sent)",
  "report": { ... },
  "preview_html": "<html>...</html>"
}
```

This endpoint generates the report without sending the email, useful for:
- Testing report generation logic
- Previewing email HTML
- Debugging data issues

### Deployment

#### Vercel Deployment

1. **Push to Git:**
   ```bash
   git add vercel.json
   git commit -m "Add monthly overage report cron job"
   git push
   ```

2. **Vercel will automatically:**
   - Detect the `vercel.json` configuration
   - Set up the cron job
   - Execute on schedule

3. **Verify in Vercel Dashboard:**
   - Go to your project → Settings → Cron Jobs
   - You should see the monthly-report job listed
   - Check execution logs after the scheduled time

#### Environment Variables in Vercel

1. Go to your Vercel project → Settings → Environment Variables
2. Add:
   - `RESEND_API_KEY` (required)
   - `CRON_SECRET` (recommended)
3. Redeploy if needed

### Monitoring

#### Check Cron Execution

**Vercel Dashboard:**
- Project → Deployments → Functions
- Look for `/api/cron/monthly-report` executions
- View logs for each execution

**Application Logs:**
```
=== Monthly overage report cron job started ===
Timestamp: 2025-01-31T23:00:00.000Z
Generating overage report...
Report generated: { month: '2025-01-01', total_revenue: 150000, clubs_count: 3 }
Sending email to: victory1080@gmail.com
Email sent successfully: { id: 'email-id' }
=== Monthly overage report cron job completed ===
```

#### Troubleshooting

**Cron not executing:**
1. Check `vercel.json` is in project root
2. Verify deployment was successful
3. Check Vercel dashboard for cron job configuration
4. Ensure project is on a paid plan (cron jobs require Hobby or Pro)

**Email not sending:**
1. Verify `RESEND_API_KEY` is set correctly
2. Check Resend dashboard for API key status
3. Review function logs for error messages
4. Test with manual GET endpoint first

**Wrong data in report:**
1. Verify database schema is correct
2. Check `booking_usage_tracking` table has data
3. Ensure clubs have active subscriptions
4. Test with manual GET endpoint to see raw data

### Alternative Cron Services

If not using Vercel, you can use:

#### 1. GitHub Actions

Create `.github/workflows/monthly-report.yml`:

```yaml
name: Monthly Overage Report
on:
  schedule:
    - cron: '0 23 28-31 * *'
  workflow_dispatch:

jobs:
  send-report:
    runs-on: ubuntu-latest
    steps:
      - name: Call cron endpoint
        run: |
          curl -X POST https://your-domain.com/api/cron/monthly-report \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### 2. External Cron Service (cron-job.org, EasyCron)

Configure:
- URL: `https://your-domain.com/api/cron/monthly-report`
- Method: POST
- Schedule: Last day of month at 23:00
- Headers: `Authorization: Bearer your-cron-secret`

#### 3. Cloud Functions (AWS Lambda, Google Cloud Functions)

Deploy a cloud function that:
1. Triggers on schedule (CloudWatch Events / Cloud Scheduler)
2. Calls your API endpoint with proper authentication

### Future Enhancements

Potential improvements:
- Add multiple email recipients
- Include charts/graphs in email
- Send summary SMS notifications
- Archive reports in database
- Add weekly summary reports
- Configurable email templates
- Multi-language support

### Security Considerations

1. **Always use CRON_SECRET in production** to prevent unauthorized access
2. **Rotate secrets regularly** (every 90 days recommended)
3. **Monitor execution logs** for suspicious activity
4. **Rate limit the endpoint** if exposed publicly
5. **Use HTTPS only** for all API calls

### Support

For issues or questions:
- Check Vercel function logs
- Review Resend email logs
- Test with manual GET endpoint
- Contact system administrator

---

## Quick Reference

### Cron Schedule Syntax

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

**Examples:**
- `0 2 * * *` - Daily at 2 AM
- `0 23 28-31 * *` - Last day of month at 11 PM
- `0 */6 * * *` - Every 6 hours
- `0 0 1 * *` - First day of month at midnight

### Common Commands

**Test cron endpoints locally:**
```bash
# Start dev server
npm run dev

# Test monthly report (in another terminal)
curl http://localhost:9002/api/cron/monthly-report

# Test subscription check
curl http://localhost:9002/api/cron/check-subscriptions
```

**Check Vercel logs:**
```bash
vercel logs --follow
```

**Generate CRON_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Manual database query for expiring subscriptions:**
```sql
SELECT 
  c.name as club_name,
  cs.end_date,
  sp.display_name as plan_name
FROM club_subscriptions cs
JOIN clubs c ON cs.club_id = c.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE cs.is_active = true
AND cs.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY cs.end_date;
```

**Manual database query for overage:**
```sql
SELECT 
  c.name as club_name,
  sp.display_name as plan_name,
  sp.max_bookings_per_month as quota,
  but.booking_count as actual_bookings,
  but.overage_count,
  but.overage_fee
FROM booking_usage_tracking but
JOIN clubs c ON but.club_id = c.id
JOIN club_subscriptions cs ON c.current_subscription_id = cs.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE but.month = DATE_TRUNC('month', CURRENT_DATE)
AND but.overage_count > 0
ORDER BY but.overage_fee DESC;
```

### Environment Variables Checklist

Production deployment requires:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `CRON_SECRET` (recommended)
- [ ] `NEXT_PUBLIC_APP_URL` (optional)

### Troubleshooting Checklist

**Cron not executing:**
- [ ] `vercel.json` in project root
- [ ] Deployment successful
- [ ] Project on paid Vercel plan
- [ ] Cron job visible in Vercel dashboard

**Email not sending:**
- [ ] `RESEND_API_KEY` set correctly
- [ ] API key active in Resend dashboard
- [ ] Sending quota not exceeded
- [ ] Email address valid

**Wrong data in report:**
- [ ] Database migrations applied
- [ ] `booking_usage_tracking` has data
- [ ] Clubs have active subscriptions
- [ ] Test with manual GET endpoint

### Related Documentation

- [Subscription Management Setup](subscription-management-setup.md) - Initial setup guide
- [Admin User Guide](admin-subscription-guide.md) - How to use the system
- [Requirements](../.kiro/specs/subscription-management/requirements.md) - System requirements
- [Design](../.kiro/specs/subscription-management/design.md) - Technical design
- [Tasks](../.kiro/specs/subscription-management/tasks.md) - Implementation tasks

---

## 2. Daily Subscription Expiry Check

### Purpose
Automatically checks for expiring and expired subscriptions daily, sends email notifications to club owners, and auto-downgrades expired subscriptions to FREE plan.

### Configuration

#### Vercel Cron Job
The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-subscriptions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 2 * * *` - Runs daily at 02:00 (2 AM)
- Checks all subscriptions for expiry status
- Sends notifications and processes downgrades automatically

#### Environment Variables

Uses the same environment variables as monthly report:

```bash
# Required for email sending
RESEND_API_KEY=your-resend-api-key

# Optional: Secure cron endpoint (recommended for production)
CRON_SECRET=your-random-secret-key

# Optional: App URL for email links
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### API Endpoint

**Endpoint:** `POST /api/cron/check-subscriptions`

**Authentication:**
- If `CRON_SECRET` is set, requires `Authorization: Bearer <CRON_SECRET>` header
- Vercel automatically adds this header when calling cron jobs

**Response:**
```json
{
  "success": true,
  "message": "Subscription expiry check completed",
  "summary": {
    "total_expiring": 5,
    "total_expired": 2,
    "total_downgraded": 2,
    "expiring_emails_sent": 5,
    "expired_emails_sent": 2
  },
  "details": {
    "expiring_clubs": [...],
    "expired_clubs": [...],
    "downgrade_results": [...]
  }
}
```

### Functionality

#### 1. Expiring Subscriptions (7-day warning)
- Detects subscriptions expiring within 7 days
- Sends warning email to club owner
- Updates club `subscription_status` to `expiring_soon`
- Email includes current plan, expiry date, and renewal link

#### 2. Expired Subscriptions
- Detects subscriptions that have expired
- Automatically downgrades to FREE plan (3 months)
- Sends notification email to club owner
- Updates club `subscription_status` to `active` (with FREE plan)

#### 3. Auto-downgrade Process
For each expired subscription:
1. Deactivates old subscription
2. Creates new FREE plan subscription (3 months)
3. Updates club's current_subscription_id
4. Updates club's subscription_status
5. Logs the operation

### Email Templates

#### Expiring Warning Email (7 days)
- Subject: `⚠️ Gói đăng ký sắp hết hạn - [Club Name]`
- Orange/Yellow warning theme
- Includes countdown and renewal CTA

#### Expired Notification Email
- Subject: `🔴 Gói đăng ký đã hết hạn - [Club Name]`
- Red alert + Green success theme
- Confirms downgrade to FREE plan

### Manual Testing

**Endpoint:** `GET /api/cron/check-subscriptions`

**Authentication:** Requires admin user authentication

Processes expiries without sending emails (for testing).

### Database Functions

1. `get_expiring_subscriptions()` - Returns subscriptions expiring in 7 days
2. `get_expired_subscriptions()` - Returns expired subscriptions
3. `downgrade_expired_subscription(club_id)` - Performs downgrade
4. `update_subscription_status(club_id)` - Updates status
5. `process_all_subscription_expiries()` - Main orchestration

### Deployment

1. **Push to Git:**
   ```bash
   git add vercel.json src/app/api/cron/check-subscriptions/
   git commit -m "Add daily subscription expiry check"
   git push
   ```

2. **Run Database Migration:**
   ```bash
   supabase db push
   # Or apply: supabase/migrations/004_subscription_expiry_handling.sql
   ```

3. **Verify in Vercel Dashboard:**
   - Settings → Cron Jobs
   - Should see both monthly-report and check-subscriptions

### Monitoring

Check Vercel function logs for execution details:
```
=== Subscription expiry check cron job started ===
Processing complete: { expiring: 5, expired: 2, downgraded: 2 }
Email notifications sent: { expiring_warnings: 5, expired_notifications: 2 }
=== Subscription expiry check cron job completed ===
```

### Troubleshooting

- **Cron not executing:** Check vercel.json and deployment
- **Emails not sending:** Verify RESEND_API_KEY and club owner emails
- **Downgrades failing:** Check database migration and FREE plan exists
- **Wrong subscriptions:** Verify system date/time and end_date values

