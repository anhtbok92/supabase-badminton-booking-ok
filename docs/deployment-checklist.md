# Deployment Checklist - Subscription Management System

## Pre-Deployment

### Database Setup
- [ ] All migrations applied to production Supabase
  - [ ] `001_initial_schema.sql`
  - [ ] `002_rls_policies.sql`
  - [ ] `003_subscription_management.sql`
  - [ ] `004_subscription_expiry_handling.sql`
- [ ] Default subscription plans exist (FREE, BASIC, PRO)
- [ ] Database functions working:
  - [ ] `check_court_limit()`
  - [ ] `check_booking_quota()`
  - [ ] `increment_booking_count()`
  - [ ] `decrement_booking_count()`
  - [ ] `get_expiring_subscriptions()`
  - [ ] `get_expired_subscriptions()`
  - [ ] `downgrade_expired_subscription()`
- [ ] Run verification script: `npm run verify-subscription-schema`

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key
- [ ] `RESEND_API_KEY` - Valid Resend API key with sending quota
- [ ] `CRON_SECRET` - Generated random secret (32+ characters)
- [ ] `NEXT_PUBLIC_APP_URL` - Production domain URL
- [ ] `GOOGLE_GENAI_API_KEY` - (if using AI features)

### Code Review
- [ ] All tasks in `tasks.md` completed
- [ ] No console.log or debug code in production
- [ ] Error handling implemented
- [ ] TypeScript types defined
- [ ] No hardcoded credentials
- [ ] Email templates reviewed and tested

### Testing
- [ ] Run integration tests: `npm run test-subscription-lifecycle`
- [ ] Manual testing completed:
  - [ ] Create subscription plan
  - [ ] Assign plan to club
  - [ ] Create courts (test limit)
  - [ ] Create bookings (test quota)
  - [ ] Test overage calculation
  - [ ] Test email notifications
- [ ] Admin UI tested:
  - [ ] Subscription Plan Manager
  - [ ] Club Subscription Manager
  - [ ] Subscription Dashboard
  - [ ] Overage Report

---

## Deployment

### Vercel Configuration
- [ ] `vercel.json` configured with cron jobs:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/monthly-report",
        "schedule": "0 23 28-31 * *"
      },
      {
        "path": "/api/cron/check-subscriptions",
        "schedule": "0 2 * * *"
      }
    ]
  }
  ```
- [ ] Project on Vercel paid plan (Hobby or Pro) - Required for cron jobs

### Deploy Steps
- [ ] Push code to Git repository
- [ ] Vercel auto-deploys from main branch
- [ ] Or manual deploy: `vercel --prod`
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for errors

### Verify Deployment
- [ ] Visit production URL
- [ ] Login as admin
- [ ] Navigate to Admin Dashboard
- [ ] Check "Quản lý gói đăng ký" page loads
- [ ] Check "Thống kê doanh thu" page loads
- [ ] Verify subscription plans visible
- [ ] Check Vercel Dashboard → Cron Jobs configured

---

## Post-Deployment

### Immediate Verification (Within 1 hour)
- [ ] Test admin login
- [ ] Test subscription plan CRUD operations
- [ ] Test assigning subscription to club
- [ ] Test court creation with limit
- [ ] Test booking creation with quota tracking
- [ ] Check Vercel function logs for errors
- [ ] Check Supabase logs for database errors

### Email Configuration
- [ ] Resend domain configured (optional but recommended)
- [ ] DNS records added for domain
- [ ] Test email sending:
  ```bash
  curl https://your-domain.com/api/cron/monthly-report \
    -H "Cookie: your-admin-session-cookie"
  ```
- [ ] Verify email received at configured address
- [ ] Check email formatting and content

### Cron Job Verification
- [ ] Vercel Dashboard → Settings → Cron Jobs shows both jobs
- [ ] Wait for next scheduled execution or trigger manually
- [ ] Check function logs for successful execution
- [ ] Verify emails sent by cron jobs

### Database Verification
- [ ] Check `subscription_plans` table has 3 default plans
- [ ] Check `club_subscriptions` table structure
- [ ] Check `booking_usage_tracking` table structure
- [ ] Verify RLS policies active
- [ ] Test database functions via SQL Editor

### Security Check
- [ ] `CRON_SECRET` is set and secure
- [ ] Service role key not exposed in client code
- [ ] API routes have proper authentication
- [ ] Admin routes protected
- [ ] HTTPS enforced

---

## First Week Monitoring

### Daily Checks
- [ ] Check Vercel function logs
- [ ] Check Supabase logs
- [ ] Monitor email delivery (Resend dashboard)
- [ ] Check for user-reported issues
- [ ] Verify cron jobs executed successfully

### Weekly Review
- [ ] Review subscription dashboard metrics
- [ ] Check MRR/ARR calculations
- [ ] Verify overage calculations
- [ ] Review club distribution
- [ ] Check for any anomalies in data

---

## Rollback Plan

### If Critical Issues Occur

**Immediate Actions:**
1. [ ] Rollback to previous deployment in Vercel
2. [ ] Disable cron jobs if causing issues:
   - Remove from `vercel.json`
   - Redeploy
3. [ ] Notify users of temporary issues

**Database Rollback:**
1. [ ] Restore from Supabase backup
2. [ ] Or manually revert migrations
3. [ ] Verify data integrity

**Communication:**
1. [ ] Notify admin users
2. [ ] Post status update
3. [ ] Provide ETA for fix

---

## Success Criteria

Deployment is successful when:

- [ ] All admin features accessible
- [ ] Subscription plans can be created/edited
- [ ] Clubs can be assigned subscriptions
- [ ] Court limits enforced correctly
- [ ] Booking quotas tracked accurately
- [ ] Overage calculated correctly
- [ ] Email notifications working
- [ ] Cron jobs executing on schedule
- [ ] Dashboard showing correct metrics
- [ ] No critical errors in logs
- [ ] Performance acceptable (< 2s page load)

---

## Ongoing Maintenance

### Daily
- [ ] Monitor error logs
- [ ] Check cron job execution
- [ ] Review email delivery status

### Weekly
- [ ] Review usage statistics
- [ ] Check for expiring subscriptions
- [ ] Analyze overage patterns
- [ ] Update documentation if needed

### Monthly
- [ ] Review overage report
- [ ] Process subscription renewals
- [ ] Analyze revenue trends
- [ ] Update pricing if needed
- [ ] Backup database
- [ ] Update dependencies

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] User feedback review
- [ ] Feature planning
- [ ] Rotate secrets (CRON_SECRET, API keys)

---

## Emergency Contacts

**Technical Issues:**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Resend Support: https://resend.com/support

**Internal:**
- System Administrator: [contact info]
- Database Admin: [contact info]
- DevOps Team: [contact info]

---

## Documentation Links

- [README](../README.md) - Project overview
- [Subscription Management Setup](subscription-management-setup.md) - Initial setup
- [Cron Jobs Setup](cron-jobs-setup.md) - Cron configuration
- [Admin User Guide](admin-subscription-guide.md) - How to use the system
- [Requirements](../.kiro/specs/subscription-management/requirements.md) - System requirements
- [Design](../.kiro/specs/subscription-management/design.md) - Technical design
- [Tasks](../.kiro/specs/subscription-management/tasks.md) - Implementation tasks

---

**Last Updated:** 2025-01-31
**Version:** 1.0.0
