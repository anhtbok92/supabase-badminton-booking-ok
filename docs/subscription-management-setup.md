# Subscription Management System - Setup Guide

## Overview

This guide covers the setup of the subscription management system for the badminton court booking platform. The system allows admins to configure subscription plans, assign them to clubs, and track resource usage (courts and bookings).

## Database Schema

### Tables Created

1. **subscription_plans** - Stores subscription plan configurations
   - Default plans: FREE, BASIC, PRO
   - Fields: name, display_name, max_courts, max_bookings_per_month, prices, overage fees

2. **club_subscriptions** - Tracks club subscription assignments
   - Links clubs to plans with billing cycle and dates
   - Enforces single active subscription per club

3. **booking_usage_tracking** - Tracks monthly booking usage per club
   - Automatically calculates overage counts and fees
   - Resets monthly

### Database Functions

1. **check_court_limit(club_id)** - Returns current court count, max allowed, and whether new courts can be created
2. **check_booking_quota(club_id)** - Returns current booking count, quota, overage info, and usage percentage
3. **increment_booking_count(club_id)** - Increments monthly booking counter and calculates overage
4. **decrement_booking_count(club_id)** - Decrements counter when bookings are cancelled

## Setup Instructions

### Step 1: Apply Database Migration

#### Option A: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/003_subscription_management.sql`
4. Copy the entire content
5. Paste into SQL Editor and click **Run**

#### Option B: Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

### Step 2: Verify Migration

Run the verification script to ensure everything is set up correctly:

```bash
npm run verify-subscription-schema
```

Expected output:
```
✅ All schema verification checks passed!

📊 Summary:
  - 3 tables created (subscription_plans, club_subscriptions, booking_usage_tracking)
  - 2 columns added to clubs table
  - 4 database functions working
  - 3 default plans inserted (FREE, BASIC, PRO)
```

### Step 3: Review Default Plans

The migration creates 3 default subscription plans:

| Plan | Max Courts | Max Bookings/Month | Monthly Price | Yearly Price | Overage Fee |
|------|------------|-------------------|---------------|--------------|-------------|
| FREE | 3 | 100 | 0 VND | 0 VND | 0 VND |
| BASIC | 10 | 1,000 | 200,000 VND | 2,000,000 VND | 2,000 VND |
| PRO | 30 | 3,000 | 500,000 VND | 5,000,000 VND | 1,500 VND |

You can modify these plans later through the admin interface (to be implemented in subsequent tasks).

## TypeScript Types

The following types have been added to `src/lib/types.ts`:

- `SubscriptionPlan` - Subscription plan configuration
- `ClubSubscription` - Club subscription assignment
- `BookingUsageTracking` - Monthly usage tracking
- `CourtLimitCheck` - Result from check_court_limit()
- `BookingQuotaCheck` - Result from check_booking_quota()

The `Club` type has been extended with:
- `current_subscription_id?: string`
- `subscription_status?: 'active' | 'expiring_soon' | 'expired'`

## Testing the Functions

### Test Court Limit Check

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

const { data } = await supabase.rpc('check_court_limit', {
  p_club_id: 'your-club-id'
});

console.log(data);
// Output: [{ current_count: 2, max_allowed: 3, can_create: true }]
```

### Test Booking Quota Check

```typescript
const { data } = await supabase.rpc('check_booking_quota', {
  p_club_id: 'your-club-id'
});

console.log(data);
// Output: [{
//   current_count: 50,
//   max_allowed: 100,
//   overage_count: 0,
//   overage_fee: 0,
//   usage_percentage: 50.00
// }]
```

### Test Booking Count Increment

```typescript
await supabase.rpc('increment_booking_count', {
  p_club_id: 'your-club-id'
});
```

## Troubleshooting

### Migration Fails

If the migration fails, check:
1. Previous migrations (001 and 002) are applied
2. You have proper database permissions
3. No conflicting table/function names exist

### Verification Script Fails

Common issues:
1. **Missing environment variables** - Ensure `.env` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. **Migration not applied** - Run the migration first
3. **Permission issues** - Use service role key, not anon key

### Function Returns NULL

If database functions return NULL or unexpected results:
1. Check that the club exists in the database
2. Verify the club has a subscription assigned (or will default to FREE plan)
3. Check function logs in Supabase Dashboard > Database > Functions

## Next Steps

After completing this setup:

1. ✅ Task 1: Database schema and functions (COMPLETED)
2. ✅ Task 2-18: Implementation (COMPLETED)
3. ⏭️ Deploy to production

See `.kiro/specs/subscription-management/tasks.md` for the complete implementation plan.

---

## Deployment to Production

### Pre-deployment Checklist

Before deploying to production, ensure:

- [ ] All database migrations applied successfully
- [ ] Environment variables configured in Vercel
- [ ] Resend API key is valid and has sending quota
- [ ] Cron jobs configured in `vercel.json`
- [ ] Admin user created and tested
- [ ] Default subscription plans exist in database
- [ ] Email templates tested with real email addresses

### Deployment Steps

#### 1. Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend Email (Required for notifications)
RESEND_API_KEY=your-resend-api-key

# Cron Security (Recommended)
CRON_SECRET=your-random-secret-key

# App URL (Optional, for email links)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Other existing variables
GOOGLE_GENAI_API_KEY=your-google-genai-api-key
# ... etc
```

**Generate CRON_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2. Deploy to Vercel

**Option A: Git Push (Recommended)**
```bash
git add .
git commit -m "Add subscription management system"
git push origin main
```

Vercel will automatically:
- Build and deploy your app
- Set up cron jobs from `vercel.json`
- Apply environment variables

**Option B: Vercel CLI**
```bash
npm install -g vercel
vercel --prod
```

#### 3. Verify Deployment

After deployment:

1. **Check App:**
   - Visit your production URL
   - Login as admin
   - Navigate to Admin Dashboard → Quản lý gói đăng ký
   - Verify subscription plans are visible

2. **Check Cron Jobs:**
   - Vercel Dashboard → Your Project → Settings → Cron Jobs
   - Should see:
     - `/api/cron/monthly-report` - Monthly at 23:00 on days 28-31
     - `/api/cron/check-subscriptions` - Daily at 02:00

3. **Test Cron Endpoints:**
   ```bash
   # Test monthly report (GET for preview)
   curl https://your-domain.com/api/cron/monthly-report \
     -H "Cookie: your-admin-session-cookie"
   
   # Test subscription check (GET for preview)
   curl https://your-domain.com/api/cron/check-subscriptions \
     -H "Cookie: your-admin-session-cookie"
   ```

4. **Check Database:**
   - Supabase Dashboard → Table Editor
   - Verify tables exist: `subscription_plans`, `club_subscriptions`, `booking_usage_tracking`
   - Check default plans are present

#### 4. Post-Deployment Configuration

**Update Email Recipient (if needed):**

If you want to change the overage report recipient from `victory1080@gmail.com`:

1. Edit `src/app/api/cron/monthly-report/route.ts`
2. Change the `to` field in the email sending section
3. Commit and push

**Configure Resend Domain (Recommended):**

For better email deliverability:

1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Add DNS records as instructed
4. Update email `from` field to use your domain:
   ```typescript
   from: 'noreply@yourdomain.com'
   ```

#### 5. Test in Production

**Test Subscription Assignment:**
1. Login as admin
2. Create a test club or use existing
3. Assign BASIC plan
4. Verify club can create courts up to limit
5. Create bookings and verify counter increments

**Test Court Limit:**
1. Create courts up to plan limit
2. Try to create one more → Should be blocked
3. Upgrade plan → Should allow more courts

**Test Booking Quota:**
1. Create bookings
2. Check usage display updates
3. Verify overage calculation when exceeding quota

**Test Email Notifications:**
1. Create a club with subscription expiring in 6 days
2. Wait for daily cron (or trigger manually)
3. Check email received

**Test Overage Report:**
1. Create a club with overage bookings
2. Trigger monthly report cron (or use GET endpoint)
3. Verify email received with correct data

### Monitoring Production

#### Daily Checks

1. **Vercel Function Logs:**
   - Deployments → Functions
   - Check for errors in cron jobs
   - Monitor execution time

2. **Supabase Logs:**
   - Dashboard → Logs
   - Check for database errors
   - Monitor query performance

3. **Resend Dashboard:**
   - Check email delivery status
   - Monitor sending quota
   - Review bounce/complaint rates

#### Weekly Reviews

1. **Usage Statistics:**
   - Admin Dashboard → Thống kê doanh thu
   - Review MRR/ARR trends
   - Check club distribution

2. **Overage Patterns:**
   - Identify clubs frequently exceeding quota
   - Reach out for upsell opportunities

3. **System Health:**
   - Database size and performance
   - API response times
   - Error rates

#### Monthly Tasks

1. **Review Overage Report:**
   - Check email report received
   - Verify calculations
   - Generate invoices if needed

2. **Subscription Renewals:**
   - Check expiring subscriptions
   - Follow up with clubs
   - Process renewals

3. **Pricing Review:**
   - Analyze usage patterns
   - Adjust pricing if needed
   - Update plans based on feedback

### Rollback Plan

If issues occur after deployment:

1. **Immediate Rollback:**
   ```bash
   # In Vercel Dashboard
   Deployments → Previous Deployment → Promote to Production
   ```

2. **Database Rollback:**
   - Supabase doesn't support automatic rollback
   - Restore from backup if needed
   - Or manually revert migrations

3. **Disable Cron Jobs:**
   - Remove cron configuration from `vercel.json`
   - Redeploy
   - Cron jobs will stop executing

### Scaling Considerations

As your system grows:

**Database:**
- Monitor Supabase usage and upgrade plan if needed
- Add indexes for frequently queried columns
- Consider read replicas for analytics

**Email:**
- Upgrade Resend plan for higher sending limits
- Implement email queuing for large batches
- Add retry logic for failed sends

**Cron Jobs:**
- Consider moving to dedicated job queue (BullMQ, etc.)
- Implement distributed locking for concurrent execution
- Add monitoring and alerting

**Performance:**
- Cache subscription data in Redis
- Optimize database queries
- Use CDN for static assets

### Security Best Practices

1. **Always use CRON_SECRET** in production
2. **Rotate secrets** every 90 days
3. **Monitor for suspicious activity** in logs
4. **Use HTTPS only** for all endpoints
5. **Implement rate limiting** on API routes
6. **Regular security audits** of dependencies
7. **Backup database** daily

### Support and Maintenance

**Regular Maintenance:**
- Update dependencies monthly
- Review and optimize database queries
- Monitor error logs and fix issues
- Update documentation as system evolves

**User Support:**
- Provide admin training
- Create video tutorials
- Maintain FAQ document
- Quick response to issues

---

## Automated Reports

The system includes automated monthly overage reports sent via email. See `docs/cron-jobs-setup.md` for:
- Cron job configuration
- Email report setup
- Monitoring and troubleshooting
- Manual testing procedures

## References

- Requirements: `.kiro/specs/subscription-management/requirements.md`
- Design: `.kiro/specs/subscription-management/design.md`
- Tasks: `.kiro/specs/subscription-management/tasks.md`
- Cron Jobs: `docs/cron-jobs-setup.md`
