# Implementation Plan: Subscription Management System

## Overview

Triển khai hệ thống quản lý gói đăng ký cho câu lạc bộ, bao gồm cấu hình gói, giới hạn tài nguyên, tính phí vượt mức, và báo cáo tự động qua email.

## Tasks

- [x] 1. Setup database schema and functions
  - Create `subscription_plans` table with default plans (FREE, BASIC, PRO)
  - Create `club_subscriptions` table
  - Create `booking_usage_tracking` table
  - Add subscription columns to `clubs` table
  - Create database function `check_court_limit()`
  - Create database function `check_booking_quota()`
  - Create database function `increment_booking_count()`
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 4.1_

- [x] 2. Create TypeScript types and schemas
  - Define `SubscriptionPlan` interface
  - Define `ClubSubscription` interface
  - Define `BookingUsageTracking` interface
  - Create Zod schemas for validation
  - Add types to `src/lib/types.ts`
  - _Requirements: 1.2, 9.2_

- [x] 3. Implement Subscription Plan Manager UI
  - [x] 3.1 Create `subscription-plan-manager.tsx` component
    - Display plans in table format
    - Show plan details (name, limits, prices, overage fee)
    - Add create/edit/delete actions (admin only)
    - _Requirements: 1.5, 9.1, 9.5_
  
  - [x] 3.2 Create plan form dialog
    - Form fields: name, display_name, max_courts, max_bookings_per_month, monthly_price, yearly_price, overage_fee_per_booking
    - Validation using Zod
    - _Requirements: 9.2_
  
  - [ ]* 3.3 Write unit tests for plan manager
    - Test plan creation
    - Test plan editing
    - Test plan deletion prevention when active subscriptions exist
    - _Requirements: 9.3, 9.4_

- [x] 4. Implement API routes for subscription plans
  - [x] 4.1 Create `/api/admin/subscription-plans/route.ts`
    - GET: List all plans
    - POST: Create new plan
    - _Requirements: 1.3, 9.1_
  
  - [x] 4.2 Create `/api/admin/subscription-plans/[id]/route.ts`
    - PUT: Update plan
    - DELETE: Delete plan (check for active subscriptions)
    - _Requirements: 1.4, 9.4_
  
  - [ ]* 4.3 Write API tests
    - Test CRUD operations
    - Test admin-only access
    - _Requirements: 9.1, 9.5_

- [x] 5. Implement Club Subscription Manager UI
  - [x] 5.1 Create `club-subscription-manager.tsx` component
    - Display current subscription for each club
    - Show subscription status badge (Active, Expiring Soon, Expired)
    - Add assign/change subscription actions
    - _Requirements: 2.4, 6.5_
  
  - [x] 5.2 Create subscription assignment dialog
    - Select plan dropdown
    - Select billing cycle (monthly/yearly)
    - Set start date and auto-renew option
    - Calculate and display end date
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 5.3 Write unit tests for subscription manager
    - Test subscription assignment
    - Test plan changes
    - _Requirements: 2.1, 2.2_

- [x] 6. Implement API routes for club subscriptions
  - [x] 6.1 Create `/api/admin/club-subscriptions/route.ts`
    - POST: Assign subscription to club
    - Update `clubs.current_subscription_id`
    - Calculate end_date based on billing_cycle
    - _Requirements: 2.1_
  
  - [x] 6.2 Create `/api/admin/club-subscriptions/[id]/route.ts`
    - PUT: Update subscription (change plan, extend, cancel)
    - Handle plan upgrades/downgrades
    - _Requirements: 2.2_
  
  - [ ]* 6.3 Write API tests
    - Test subscription creation
    - Test subscription updates
    - Test single active subscription constraint
    - _Requirements: 2.1, 2.2_

- [x] 7. Update partnership registration to auto-assign FREE plan
  - Modify `src/app/register-club/page.tsx`
  - After club creation, create subscription with FREE plan
  - Set 3-month trial period
  - _Requirements: 2.3_

- [x] 8. Implement court limit enforcement
  - [x] 8.1 Update `CourtManager` component
    - Call `check_court_limit()` before creating court
    - Display current usage (e.g., "3/10 sân")
    - Show upgrade message when limit reached
    - _Requirements: 3.1, 3.2, 3.3, 11.1, 11.2_
  
  - [ ]* 8.2 Write property test for court limit
    - **Property 1: Court limit enforcement**
    - **Validates: Requirements 3.1, 3.2, 11.2, 11.3**
  
  - [ ]* 8.3 Write unit tests for court creation
    - Test creation within limit
    - Test creation at limit (should fail)
    - Test upgrade scenario
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 9. Implement booking quota tracking
  - [x] 9.1 Update booking creation logic
    - Call `increment_booking_count()` after successful booking
    - Call `check_booking_quota()` to get current usage
    - Display usage in club dashboard
    - _Requirements: 4.2, 4.5, 12.1_
  
  - [x] 9.2 Update booking cancellation logic
    - Decrement counter when booking is cancelled
    - Update overage calculations
    - _Requirements: 4.3, 12.4_
  
  - [x] 9.3 Add usage warnings
    - Show warning at 80% usage
    - Show overage notice at 100%+ usage
    - _Requirements: 6.3, 6.4, 12.5_
  
  - [ ]* 9.4 Write property test for booking count accuracy
    - **Property 2: Booking count accuracy**
    - **Validates: Requirements 4.1, 4.2, 4.3, 12.2, 12.3, 12.4**
  
  - [ ]* 9.5 Write property test for overage calculation
    - **Property 3: Overage calculation correctness**
    - **Validates: Requirements 5.1, 5.2, 10.1**

- [x] 10. Checkpoint - Test quota tracking
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Subscription Dashboard
  - [x] 11.1 Create `subscription-dashboard.tsx` component
    - Display MRR (Monthly Recurring Revenue)
    - Display ARR (Annual Recurring Revenue)
    - Show club distribution by plan (pie chart)
    - Show total overage revenue
    - _Requirements: 7.1, 7.2, 7.3, 7.5_
  
  - [x] 11.2 Add usage statistics
    - Average bookings per club per plan
    - Total bookings across all clubs
    - Supabase usage estimation
    - _Requirements: 7.4, 8.1, 8.2_
  
  - [ ]* 11.3 Write unit tests for dashboard calculations
    - Test MRR/ARR calculations
    - Test revenue aggregations
    - _Requirements: 7.1, 7.2, 7.5_

- [x] 12. Implement overage reporting
  - [x] 12.1 Create `/api/admin/overage-report/route.ts`
    - Query all clubs with overage in specified month
    - Calculate total overage revenue
    - Return formatted report data
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [x] 12.2 Add overage report UI in dashboard
    - Display monthly overage summary
    - Show clubs with overage in table
    - Export to CSV option
    - _Requirements: 10.5_
  
  - [ ]* 12.3 Write unit tests for overage report
    - Test report generation
    - Test revenue calculations
    - _Requirements: 10.1, 10.2_

- [x] 13. Implement monthly email report
  - [x] 13.1 Create `/api/cron/monthly-report/route.ts`
    - Generate overage report for previous month
    - Format HTML email with report data
    - Send to victory1080@gmail.com using Resend
    - _Requirements: 10.3, 10.4_
  
  - [x] 13.2 Setup cron job
    - Configure to run on last day of month
    - Add error handling and retry logic
    - Log execution results
    - _Requirements: 10.3_
  
  - [ ]* 13.3 Write integration test for email report
    - Test report generation
    - Test email formatting
    - Mock email sending
    - _Requirements: 10.4_

- [x] 14. Implement subscription expiry handling
  - [x] 14.1 Create database function for expiry check
    - Check subscriptions expiring in 7 days
    - Check expired subscriptions
    - Auto-downgrade expired to FREE plan
    - _Requirements: 2.5, 6.1, 6.2_
  
  - [x] 14.2 Create `/api/cron/check-subscriptions/route.ts`
    - Run daily to check expiring/expired subscriptions
    - Send email notifications
    - Update subscription status
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 14.3 Write property test for expiry handling
    - **Property 5: Subscription expiry handling**
    - **Validates: Requirements 2.5**

- [x] 15. Implement notification system
  - [x] 15.1 Create notification helper functions
    - Send expiry warning (7 days before)
    - Send expiry notification
    - Send quota warning (80%, 90%, 100%)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 15.2 Integrate notifications into booking flow
    - Check quota after each booking
    - Send notifications at thresholds
    - _Requirements: 5.4_
  
  - [ ]* 15.3 Write unit tests for notifications
    - Test notification triggers
    - Test email content
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 16. Add subscription info to admin sidebar
  - Update `admin-dashboard.tsx`
  - Add "Quản lý gói đăng ký" menu item
  - Add "Thống kê doanh thu" menu item
  - _Requirements: 1.5, 7.1_

- [x] 17. Checkpoint - Integration testing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Final integration and testing
  - [x] 18.1 Test complete subscription lifecycle
    - Create club → Auto-assign FREE → Upgrade to BASIC → Create courts → Create bookings → Check overage
    - _Requirements: All_
  
  - [x] 18.2 Test admin workflows
    - Configure plans → Assign to clubs → View analytics → Generate reports
    - _Requirements: 9.1, 9.2, 7.1, 10.1_
  
  - [ ]* 18.3 Write property test for single active subscription
    - **Property 7: Single active subscription per club**
    - **Validates: Requirements 2.1, 2.2**
  
  - [ ]* 18.4 Write property test for overage report completeness
    - **Property 8: Overage report completeness**
    - **Validates: Requirements 10.3, 10.4**

- [x] 19. Documentation and deployment
  - Update README with subscription management features
  - Document cron job setup
  - Add admin user guide for subscription management
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Database functions handle core business logic for performance and consistency
- Email notifications use existing Resend integration
- Cron jobs can be implemented using Vercel Cron or similar service
