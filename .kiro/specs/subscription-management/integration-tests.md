# Integration Tests - Subscription Management System

## Test Environment Setup

Before running these tests, ensure:
1. Supabase database is running with all migrations applied
2. Admin user is created and authenticated
3. Test data can be cleaned up after tests

## Test Suite 18.1: Complete Subscription Lifecycle

### Test Case 1.1: Club Creation with Auto-Assigned FREE Plan

**Objective**: Verify that new clubs automatically receive FREE plan with 3-month trial

**Steps**:
1. Navigate to `/register-club`
2. Fill in club registration form:
   - Club name: "Test Club Lifecycle"
   - Owner name: "Test Owner"
   - Phone: "0123456789"
   - Email: "testclub@example.com"
   - Address: "123 Test Street"
3. Submit the form
4. Verify club is created successfully

**Expected Results**:
- Club is created in database
- `club_subscriptions` table has new record with:
  - `plan_id` = FREE plan ID
  - `is_active` = true
  - `end_date` = 3 months from start_date
  - `billing_cycle` = 'monthly'
- `clubs.current_subscription_id` points to the new subscription
- `clubs.subscription_status` = 'active'

**Validation Query**:
```sql
SELECT 
  c.name,
  c.subscription_status,
  cs.billing_cycle,
  cs.start_date,
  cs.end_date,
  sp.name as plan_name,
  sp.max_courts,
  sp.max_bookings_per_month
FROM clubs c
JOIN club_subscriptions cs ON c.current_subscription_id = cs.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE c.name = 'Test Club Lifecycle';
```

**Requirements Validated**: 2.3

---

### Test Case 1.2: Upgrade from FREE to BASIC Plan

**Objective**: Verify admin can upgrade club subscription

**Steps**:
1. Login as admin
2. Navigate to admin panel → "Quản lý gói đăng ký"
3. Find "Test Club Lifecycle" in the list
4. Click "Gán gói" or "Thay đổi gói"
5. Select "BASIC" plan
6. Select billing cycle: "monthly"
7. Set start date: today
8. Enable auto-renew
9. Submit the form

**Expected Results**:
- Previous FREE subscription is deactivated (`is_active` = false)
- New BASIC subscription is created with:
  - `plan_id` = BASIC plan ID
  - `is_active` = true
  - `billing_cycle` = 'monthly'
  - `end_date` = 1 month from start_date
  - `auto_renew` = true
- `clubs.current_subscription_id` updated to new subscription
- Club limits updated:
  - max_courts: 10
  - max_bookings_per_month: 1000

**Validation Query**:
```sql
SELECT 
  c.name,
  cs.is_active,
  sp.name as plan_name,
  sp.max_courts,
  sp.max_bookings_per_month,
  cs.start_date,
  cs.end_date,
  cs.auto_renew
FROM clubs c
JOIN club_subscriptions cs ON c.current_subscription_id = cs.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE c.name = 'Test Club Lifecycle';
```

**Requirements Validated**: 2.1, 2.2

---

### Test Case 1.3: Create Courts Within Limit

**Objective**: Verify court creation respects subscription limits

**Steps**:
1. Login as club owner for "Test Club Lifecycle"
2. Navigate to court management
3. Create courts one by one:
   - Court 1: "Sân 1"
   - Court 2: "Sân 2"
   - Court 3: "Sân 3"
   - ... continue up to 10 courts
4. Verify court counter displays "X/10 sân"

**Expected Results**:
- All 10 courts are created successfully
- Court counter shows "10/10 sân"
- No error messages displayed

**Validation Query**:
```sql
SELECT 
  c.name as club_name,
  COUNT(co.id) as court_count,
  sp.max_courts
FROM clubs c
LEFT JOIN courts co ON c.id = co.club_id
JOIN club_subscriptions cs ON c.current_subscription_id = cs.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE c.name = 'Test Club Lifecycle'
GROUP BY c.name, sp.max_courts;
```

**Requirements Validated**: 3.1, 3.3, 11.1

---

### Test Case 1.4: Court Creation Beyond Limit

**Objective**: Verify system prevents court creation when limit is reached

**Steps**:
1. Continue from Test Case 1.3
2. Attempt to create 11th court: "Sân 11"
3. Observe error message

**Expected Results**:
- Court creation is blocked
- Error message displayed: "Đã đạt giới hạn. Gói hiện tại chỉ cho phép 10 sân. Vui lòng nâng cấp gói."
- Court count remains at 10

**Validation Function**:
```sql
SELECT * FROM check_court_limit('[club_id]');
-- Should return: current_count=10, max_allowed=10, can_create=false
```

**Requirements Validated**: 3.2, 11.2

---

### Test Case 1.5: Create Bookings and Track Quota

**Objective**: Verify booking quota tracking and counter increment

**Steps**:
1. Login as regular user
2. Navigate to booking page for "Test Club Lifecycle"
3. Create 50 bookings for various dates/times
4. Check club dashboard for booking usage

**Expected Results**:
- All 50 bookings are created successfully
- `booking_usage_tracking` table shows:
  - `booking_count` = 50
  - `overage_count` = 0
  - `overage_fee` = 0
- Club dashboard displays: "50/1000 bookings tháng này"
- No warnings displayed (usage < 80%)

**Validation Query**:
```sql
SELECT 
  c.name as club_name,
  but.booking_count,
  but.overage_count,
  but.overage_fee,
  sp.max_bookings_per_month,
  ROUND((but.booking_count::NUMERIC / sp.max_bookings_per_month::NUMERIC) * 100, 2) as usage_percentage
FROM clubs c
JOIN booking_usage_tracking but ON c.id = but.club_id
JOIN club_subscriptions cs ON c.current_subscription_id = cs.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE c.name = 'Test Club Lifecycle'
  AND but.month = DATE_TRUNC('month', CURRENT_DATE);
```

**Requirements Validated**: 4.1, 4.2, 4.5, 12.1

---

### Test Case 1.6: Booking Quota Warning at 80%

**Objective**: Verify warning is displayed when quota reaches 80%

**Steps**:
1. Continue from Test Case 1.5
2. Create additional bookings to reach 800 total (80% of 1000)
3. Create one more booking (801st)
4. Observe warning message

**Expected Results**:
- Warning toast displayed: "Cảnh báo quota. Đã sử dụng 80.1% quota tháng này (801/1000)"
- Booking is still created successfully
- No overage fees yet

**Validation Function**:
```sql
SELECT * FROM check_booking_quota('[club_id]');
-- Should return: current_count=801, max_allowed=1000, overage_count=0, usage_percentage=80.10
```

**Requirements Validated**: 6.3, 12.5

---

### Test Case 1.7: Booking Overage Calculation

**Objective**: Verify overage fees are calculated correctly when quota is exceeded

**Steps**:
1. Continue from Test Case 1.6
2. Create additional bookings to exceed 1000 (e.g., create 250 more bookings)
3. Check overage calculation

**Expected Results**:
- All bookings are created (total: 1051)
- `booking_usage_tracking` shows:
  - `booking_count` = 1051
  - `overage_count` = 51
  - `overage_fee` = 51 × 2000 = 102,000 VND (BASIC plan overage fee)
- Overage notice displayed with fee information
- Club dashboard shows: "1051/1000 bookings tháng này (Vượt 51 bookings)"

**Validation Query**:
```sql
SELECT 
  c.name as club_name,
  but.booking_count,
  but.overage_count,
  but.overage_fee,
  sp.overage_fee_per_booking,
  sp.max_bookings_per_month
FROM clubs c
JOIN booking_usage_tracking but ON c.id = but.club_id
JOIN club_subscriptions cs ON c.current_subscription_id = cs.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE c.name = 'Test Club Lifecycle'
  AND but.month = DATE_TRUNC('month', CURRENT_DATE);
```

**Requirements Validated**: 5.1, 5.2, 10.1

---

### Test Case 1.8: Booking Cancellation Decrements Counter

**Objective**: Verify booking cancellation reduces the counter

**Steps**:
1. Continue from Test Case 1.7
2. Cancel 10 bookings
3. Check updated counter

**Expected Results**:
- `booking_count` = 1041
- `overage_count` = 41
- `overage_fee` = 41 × 2000 = 82,000 VND
- Dashboard reflects updated numbers

**Validation Query**:
```sql
SELECT 
  but.booking_count,
  but.overage_count,
  but.overage_fee
FROM booking_usage_tracking but
JOIN clubs c ON but.club_id = c.id
WHERE c.name = 'Test Club Lifecycle'
  AND but.month = DATE_TRUNC('month', CURRENT_DATE);
```

**Requirements Validated**: 4.3, 12.4

---

## Test Suite 18.2: Admin Workflows

### Test Case 2.1: Configure Subscription Plans

**Objective**: Verify admin can create, edit, and manage subscription plans

**Steps**:
1. Login as admin
2. Navigate to admin panel → "Quản lý gói đăng ký"
3. Click "Tạo gói mới"
4. Fill in plan details:
   - Name: "PREMIUM"
   - Display name: "Gói Cao cấp"
   - Max courts: 50
   - Max bookings per month: 5000
   - Monthly price: 1,000,000 VND
   - Yearly price: 10,000,000 VND
   - Overage fee per booking: 1,000 VND
5. Submit the form
6. Verify plan appears in the list

**Expected Results**:
- New PREMIUM plan is created in database
- Plan appears in subscription plans table
- All fields are saved correctly
- Plan is marked as active

**Validation Query**:
```sql
SELECT * FROM subscription_plans WHERE name = 'PREMIUM';
```

**Requirements Validated**: 9.1, 9.2

---

### Test Case 2.2: Edit Existing Plan

**Objective**: Verify admin can edit plan details

**Steps**:
1. Continue from Test Case 2.1
2. Click edit button for PREMIUM plan
3. Change monthly price to 900,000 VND
4. Change overage fee to 900 VND
5. Submit the form

**Expected Results**:
- Plan is updated in database
- Changes are reflected in the table
- Existing subscriptions retain old pricing (immutability)

**Validation Query**:
```sql
SELECT 
  name,
  monthly_price,
  overage_fee_per_booking,
  updated_at
FROM subscription_plans 
WHERE name = 'PREMIUM';
```

**Requirements Validated**: 1.4, 9.1

---

### Test Case 2.3: Prevent Deletion of Active Plans

**Objective**: Verify system prevents deletion of plans with active subscriptions

**Steps**:
1. Navigate to subscription plans list
2. Try to delete BASIC plan (which has active subscriptions from Test Case 1.2)
3. Observe error message

**Expected Results**:
- Deletion is blocked
- Error message: "Không thể xóa gói đang có câu lạc bộ sử dụng"
- Plan remains in database

**Requirements Validated**: 9.4

---

### Test Case 2.4: Assign Subscription to Club

**Objective**: Verify admin can assign subscription plans to clubs

**Steps**:
1. Navigate to "Quản lý gói đăng ký" → Club subscriptions tab
2. Find a club without subscription or with FREE plan
3. Click "Gán gói"
4. Select PRO plan
5. Select billing cycle: "yearly"
6. Set start date: today
7. Enable auto-renew
8. Submit

**Expected Results**:
- New subscription is created
- Club's current_subscription_id is updated
- End date is calculated correctly (1 year from start)
- Club limits are updated to PRO plan limits

**Validation Query**:
```sql
SELECT 
  c.name,
  sp.name as plan_name,
  cs.billing_cycle,
  cs.start_date,
  cs.end_date,
  cs.auto_renew
FROM clubs c
JOIN club_subscriptions cs ON c.current_subscription_id = cs.id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE cs.billing_cycle = 'yearly' AND sp.name = 'PRO';
```

**Requirements Validated**: 2.1

---

### Test Case 2.5: View Analytics Dashboard

**Objective**: Verify subscription analytics are calculated correctly

**Steps**:
1. Navigate to admin panel → "Thống kê doanh thu"
2. Review displayed metrics

**Expected Results**:
- MRR (Monthly Recurring Revenue) is calculated correctly
  - Sum of all monthly subscriptions + (yearly subscriptions / 12)
- ARR (Annual Recurring Revenue) is calculated correctly
  - MRR × 12
- Club distribution by plan shows correct counts
- Total overage revenue is displayed
- Average bookings per club per plan is shown

**Validation Queries**:
```sql
-- MRR Calculation
SELECT 
  SUM(CASE 
    WHEN cs.billing_cycle = 'monthly' THEN sp.monthly_price
    WHEN cs.billing_cycle = 'yearly' THEN sp.yearly_price / 12
  END) as mrr
FROM club_subscriptions cs
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE cs.is_active = true;

-- Club distribution
SELECT 
  sp.name,
  COUNT(cs.id) as club_count
FROM subscription_plans sp
LEFT JOIN club_subscriptions cs ON sp.id = cs.plan_id AND cs.is_active = true
GROUP BY sp.name;

-- Total overage revenue
SELECT 
  SUM(overage_fee) as total_overage_revenue
FROM booking_usage_tracking
WHERE month = DATE_TRUNC('month', CURRENT_DATE);
```

**Requirements Validated**: 7.1, 7.2, 7.3, 7.5

---

### Test Case 2.6: Generate Overage Report

**Objective**: Verify overage report generation for clubs exceeding quota

**Steps**:
1. Navigate to "Thống kê doanh thu" → Overage report section
2. Select current month
3. Click "Tạo báo cáo"
4. Review report data

**Expected Results**:
- Report shows all clubs with overage_count > 0
- For each club, displays:
  - Club name
  - Plan name
  - Quota (max_bookings_per_month)
  - Actual bookings
  - Overage count
  - Overage fee
- Total overage revenue is calculated correctly
- Export to CSV option works

**Validation Query**:
```sql
SELECT 
  c.name as club_name,
  sp.name as plan_name,
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

**Requirements Validated**: 10.1, 10.2, 10.5

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Test email configured for notifications
- [ ] Supabase connection verified

### Test Suite 18.1 Execution
- [ ] Test Case 1.1: Club creation with FREE plan
- [ ] Test Case 1.2: Upgrade to BASIC plan
- [ ] Test Case 1.3: Create courts within limit
- [ ] Test Case 1.4: Court creation beyond limit
- [ ] Test Case 1.5: Create bookings and track quota
- [ ] Test Case 1.6: Booking quota warning at 80%
- [ ] Test Case 1.7: Booking overage calculation
- [ ] Test Case 1.8: Booking cancellation decrements counter

### Test Suite 18.2 Execution
- [ ] Test Case 2.1: Configure subscription plans
- [ ] Test Case 2.2: Edit existing plan
- [ ] Test Case 2.3: Prevent deletion of active plans
- [ ] Test Case 2.4: Assign subscription to club
- [ ] Test Case 2.5: View analytics dashboard
- [ ] Test Case 2.6: Generate overage report

### Post-Test Cleanup
- [ ] Delete test club "Test Club Lifecycle"
- [ ] Delete test subscription records
- [ ] Delete test booking records
- [ ] Delete PREMIUM plan (if created)
- [ ] Reset booking usage tracking for test month

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1.1 | ⬜ Not Run | |
| 1.2 | ⬜ Not Run | |
| 1.3 | ⬜ Not Run | |
| 1.4 | ⬜ Not Run | |
| 1.5 | ⬜ Not Run | |
| 1.6 | ⬜ Not Run | |
| 1.7 | ⬜ Not Run | |
| 1.8 | ⬜ Not Run | |
| 2.1 | ⬜ Not Run | |
| 2.2 | ⬜ Not Run | |
| 2.3 | ⬜ Not Run | |
| 2.4 | ⬜ Not Run | |
| 2.5 | ⬜ Not Run | |
| 2.6 | ⬜ Not Run | |

## Notes

- These tests should be executed in order as they build upon each other
- Test data should be cleaned up after execution
- Some tests require manual verification through the UI
- SQL validation queries are provided for automated verification
- Consider automating these tests using Playwright or Cypress in the future
