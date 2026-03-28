# Design Document - Subscription Management System

## Overview

Hệ thống subscription management cho phép admin cấu hình và quản lý các gói đăng ký cho câu lạc bộ, bao gồm giới hạn tài nguyên (sân, booking), tính phí vượt mức, và báo cáo tự động. Hệ thống được thiết kế để tích hợp vào admin panel hiện tại và sử dụng Supabase làm backend.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Admin Panel    │
│  (React/Next.js)│
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
┌────────▼────────┐  ┌──────▼──────────┐
│ Subscription    │  │  Email Service  │
│ Manager UI      │  │  (Resend API)   │
└────────┬────────┘  └─────────────────┘
         │
┌────────▼────────────────────────────┐
│      Supabase Backend               │
│  ┌──────────────────────────────┐  │
│  │  subscription_plans          │  │
│  │  club_subscriptions          │  │
│  │  booking_usage_tracking      │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Database Functions          │  │
│  │  - check_court_limit()       │  │
│  │  - check_booking_quota()     │  │
│  │  - calculate_overage()       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Component Interaction Flow

1. **Admin configures plans** → Stores in `subscription_plans` table
2. **Admin assigns plan to club** → Creates record in `club_subscriptions`
3. **Club owner creates court** → System checks `check_court_limit()` → Allow/Deny
4. **User creates booking** → System increments counter → Checks quota → Calculate overage if needed
5. **End of month** → Cron job generates report → Sends email to admin

## Components and Interfaces

### 1. Database Schema

#### Table: `subscription_plans`

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'FREE', 'BASIC', 'PRO'
  display_name VARCHAR(100) NOT NULL, -- 'Gói Miễn phí', 'Gói Cơ bản', 'Gói Chuyên nghiệp'
  max_courts INTEGER NOT NULL,
  max_bookings_per_month INTEGER NOT NULL,
  monthly_price INTEGER NOT NULL, -- VND
  yearly_price INTEGER NOT NULL, -- VND
  overage_fee_per_booking INTEGER NOT NULL, -- VND per booking over quota
  is_active BOOLEAN DEFAULT true,
  features JSONB, -- Additional features list
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default plans
INSERT INTO subscription_plans (name, display_name, max_courts, max_bookings_per_month, monthly_price, yearly_price, overage_fee_per_booking, features) VALUES
('FREE', 'Gói Miễn phí', 3, 100, 0, 0, 0, '{"trial_months": 3, "support": "email"}'),
('BASIC', 'Gói Cơ bản', 10, 1000, 200000, 2000000, 2000, '{"support": "email", "analytics": true}'),
('PRO', 'Gói Chuyên nghiệp', 30, 3000, 500000, 5000000, 1500, '{"support": "priority", "analytics": true, "custom_features": true}');
```

#### Table: `club_subscriptions`

```sql
CREATE TABLE club_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  billing_cycle VARCHAR(20) NOT NULL, -- 'monthly' or 'yearly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(club_id, is_active) -- Only one active subscription per club
);

-- Index for fast lookups
CREATE INDEX idx_club_subscriptions_club_id ON club_subscriptions(club_id);
CREATE INDEX idx_club_subscriptions_active ON club_subscriptions(is_active, end_date);
```

#### Table: `booking_usage_tracking`

```sql
CREATE TABLE booking_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of the month (e.g., '2025-01-01')
  booking_count INTEGER DEFAULT 0,
  overage_count INTEGER DEFAULT 0,
  overage_fee INTEGER DEFAULT 0, -- Total overage fee in VND
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(club_id, month)
);

-- Index for fast monthly lookups
CREATE INDEX idx_booking_usage_club_month ON booking_usage_tracking(club_id, month);
```

#### Modify existing `clubs` table

```sql
-- Add subscription-related columns to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS current_subscription_id UUID REFERENCES club_subscriptions(id);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active'; -- 'active', 'expiring_soon', 'expired'
```

### 2. Database Functions

#### Function: `check_court_limit(club_id UUID)`

```sql
CREATE OR REPLACE FUNCTION check_court_limit(p_club_id UUID)
RETURNS TABLE(current_count INTEGER, max_allowed INTEGER, can_create BOOLEAN) AS $$
DECLARE
  v_current_count INTEGER;
  v_max_allowed INTEGER;
BEGIN
  -- Get current court count
  SELECT COUNT(*) INTO v_current_count
  FROM courts
  WHERE club_id = p_club_id;
  
  -- Get max allowed from subscription plan
  SELECT sp.max_courts INTO v_max_allowed
  FROM clubs c
  JOIN club_subscriptions cs ON c.current_subscription_id = cs.id
  JOIN subscription_plans sp ON cs.plan_id = sp.id
  WHERE c.id = p_club_id AND cs.is_active = true;
  
  -- If no subscription, default to FREE plan limits
  IF v_max_allowed IS NULL THEN
    SELECT max_courts INTO v_max_allowed
    FROM subscription_plans
    WHERE name = 'FREE';
  END IF;
  
  RETURN QUERY SELECT v_current_count, v_max_allowed, (v_current_count < v_max_allowed);
END;
$$ LANGUAGE plpgsql;
```

#### Function: `check_booking_quota(club_id UUID)`

```sql
CREATE OR REPLACE FUNCTION check_booking_quota(p_club_id UUID)
RETURNS TABLE(
  current_count INTEGER,
  max_allowed INTEGER,
  overage_count INTEGER,
  overage_fee INTEGER,
  usage_percentage NUMERIC
) AS $$
DECLARE
  v_current_month DATE;
  v_current_count INTEGER;
  v_max_allowed INTEGER;
  v_overage_fee_rate INTEGER;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE);
  
  -- Get current booking count for this month
  SELECT COALESCE(booking_count, 0) INTO v_current_count
  FROM booking_usage_tracking
  WHERE club_id = p_club_id AND month = v_current_month;
  
  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;
  
  -- Get max allowed and overage fee from subscription plan
  SELECT sp.max_bookings_per_month, sp.overage_fee_per_booking
  INTO v_max_allowed, v_overage_fee_rate
  FROM clubs c
  JOIN club_subscriptions cs ON c.current_subscription_id = cs.id
  JOIN subscription_plans sp ON cs.plan_id = sp.id
  WHERE c.id = p_club_id AND cs.is_active = true;
  
  -- If no subscription, default to FREE plan
  IF v_max_allowed IS NULL THEN
    SELECT max_bookings_per_month, overage_fee_per_booking
    INTO v_max_allowed, v_overage_fee_rate
    FROM subscription_plans
    WHERE name = 'FREE';
  END IF;
  
  RETURN QUERY SELECT
    v_current_count,
    v_max_allowed,
    GREATEST(0, v_current_count - v_max_allowed) AS overage_count,
    GREATEST(0, v_current_count - v_max_allowed) * v_overage_fee_rate AS overage_fee,
    ROUND((v_current_count::NUMERIC / v_max_allowed::NUMERIC) * 100, 2) AS usage_percentage;
END;
$$ LANGUAGE plpgsql;
```

#### Function: `increment_booking_count(club_id UUID)`

```sql
CREATE OR REPLACE FUNCTION increment_booking_count(p_club_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_month DATE;
  v_max_allowed INTEGER;
  v_overage_fee_rate INTEGER;
  v_new_count INTEGER;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE);
  
  -- Get plan limits
  SELECT sp.max_bookings_per_month, sp.overage_fee_per_booking
  INTO v_max_allowed, v_overage_fee_rate
  FROM clubs c
  JOIN club_subscriptions cs ON c.current_subscription_id = cs.id
  JOIN subscription_plans sp ON cs.plan_id = sp.id
  WHERE c.id = p_club_id AND cs.is_active = true;
  
  -- Insert or update booking count
  INSERT INTO booking_usage_tracking (club_id, month, booking_count, overage_count, overage_fee)
  VALUES (p_club_id, v_current_month, 1, 0, 0)
  ON CONFLICT (club_id, month)
  DO UPDATE SET
    booking_count = booking_usage_tracking.booking_count + 1,
    overage_count = GREATEST(0, booking_usage_tracking.booking_count + 1 - v_max_allowed),
    overage_fee = GREATEST(0, booking_usage_tracking.booking_count + 1 - v_max_allowed) * v_overage_fee_rate,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 3. API Routes

#### `/api/admin/subscription-plans` (GET, POST, PUT, DELETE)

**GET** - List all plans
```typescript
Response: {
  plans: SubscriptionPlan[]
}
```

**POST** - Create new plan
```typescript
Request: {
  name: string,
  display_name: string,
  max_courts: number,
  max_bookings_per_month: number,
  monthly_price: number,
  yearly_price: number,
  overage_fee_per_booking: number,
  features: object
}
```

**PUT** - Update plan
```typescript
Request: {
  id: string,
  ...fields to update
}
```

**DELETE** - Delete plan (only if no active subscriptions)

#### `/api/admin/club-subscriptions` (POST, PUT)

**POST** - Assign plan to club
```typescript
Request: {
  club_id: string,
  plan_id: string,
  billing_cycle: 'monthly' | 'yearly',
  start_date: string,
  auto_renew: boolean
}
```

**PUT** - Update subscription (change plan, extend, cancel)

#### `/api/admin/overage-report` (GET)

**GET** - Generate monthly overage report
```typescript
Query: {
  month?: string // Default: current month
}

Response: {
  month: string,
  total_overage_revenue: number,
  clubs: Array<{
    club_id: string,
    club_name: string,
    plan_name: string,
    quota: number,
    actual_bookings: number,
    overage_count: number,
    overage_fee: number
  }>
}
```

#### `/api/cron/monthly-report` (POST)

Cron job endpoint (called on last day of month)
- Generates overage report
- Sends email to victory1080@gmail.com
- Resets counters for new month (handled by database)

### 4. React Components

#### `SubscriptionPlanManager` Component

Location: `src/app/admin/_components/subscription-plan-manager.tsx`

Features:
- Table displaying all subscription plans
- Create/Edit/Delete plan dialog
- Real-time validation
- Admin-only access

#### `ClubSubscriptionManager` Component

Location: `src/app/admin/_components/club-subscription-manager.tsx`

Features:
- Assign/change subscription for clubs
- View subscription history
- Display expiry dates and status
- Upgrade/downgrade actions

#### `SubscriptionDashboard` Component

Location: `src/app/admin/_components/subscription-dashboard.tsx`

Features:
- Revenue analytics (MRR, ARR)
- Club distribution by plan
- Overage revenue tracking
- Usage statistics

#### Update `CourtManager` Component

Add court limit checking:
```typescript
// Before creating court
const { data: limitCheck } = await supabase.rpc('check_court_limit', { p_club_id: clubId });
if (!limitCheck.can_create) {
  toast({
    title: "Đã đạt giới hạn",
    description: `Gói hiện tại chỉ cho phép ${limitCheck.max_allowed} sân. Vui lòng nâng cấp gói.`,
    variant: "destructive"
  });
  return;
}
```

#### Update Booking Creation Logic

Add booking quota tracking:
```typescript
// After successful booking creation
await supabase.rpc('increment_booking_count', { p_club_id: clubId });

// Check quota and show warning
const { data: quota } = await supabase.rpc('check_booking_quota', { p_club_id: clubId });
if (quota.usage_percentage >= 80) {
  toast({
    title: "Cảnh báo quota",
    description: `Đã sử dụng ${quota.usage_percentage}% quota tháng này (${quota.current_count}/${quota.max_allowed})`,
    variant: "warning"
  });
}
```

## Data Models

### TypeScript Interfaces

```typescript
interface SubscriptionPlan {
  id: string;
  name: 'FREE' | 'BASIC' | 'PRO';
  display_name: string;
  max_courts: number;
  max_bookings_per_month: number;
  monthly_price: number;
  yearly_price: number;
  overage_fee_per_booking: number;
  is_active: boolean;
  features: {
    trial_months?: number;
    support: 'email' | 'priority';
    analytics?: boolean;
    custom_features?: boolean;
  };
  created_at: string;
  updated_at: string;
}

interface ClubSubscription {
  id: string;
  club_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan; // Joined data
}

interface BookingUsageTracking {
  id: string;
  club_id: string;
  month: string; // YYYY-MM-01
  booking_count: number;
  overage_count: number;
  overage_fee: number;
  created_at: string;
  updated_at: string;
}

interface CourtLimitCheck {
  current_count: number;
  max_allowed: number;
  can_create: boolean;
}

interface BookingQuotaCheck {
  current_count: number;
  max_allowed: number;
  overage_count: number;
  overage_fee: number;
  usage_percentage: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Court limit enforcement
*For any* club and subscription plan, the number of courts created should never exceed the plan's max_courts limit.
**Validates: Requirements 3.1, 3.2, 11.2, 11.3**

### Property 2: Booking count accuracy
*For any* club in a given month, the booking_count in booking_usage_tracking should equal the actual number of bookings created minus cancelled bookings.
**Validates: Requirements 4.1, 4.2, 4.3, 12.2, 12.3, 12.4**

### Property 3: Overage calculation correctness
*For any* club exceeding their booking quota, the overage_fee should equal (actual_bookings - max_allowed) × overage_fee_per_booking.
**Validates: Requirements 5.1, 5.2, 10.1**

### Property 4: Monthly counter reset
*For any* club, on the 1st day of each month, the booking counter should reset to 0.
**Validates: Requirements 4.4, 12.2**

### Property 5: Subscription expiry handling
*For any* club with an expired subscription, the system should automatically assign the FREE plan.
**Validates: Requirements 2.5**

### Property 6: Plan configuration immutability for active subscriptions
*For any* subscription plan update, existing active subscriptions should retain their original plan configuration.
**Validates: Requirements 1.4**

### Property 7: Single active subscription per club
*For any* club, there should be at most one active subscription at any given time.
**Validates: Requirements 2.1, 2.2**

### Property 8: Overage report completeness
*For any* monthly overage report, all clubs with overage_count > 0 should be included in the report.
**Validates: Requirements 10.3, 10.4**

## Error Handling

### Court Creation Errors
- **Limit exceeded**: Display upgrade message with current plan details
- **No subscription**: Assign FREE plan automatically
- **Database error**: Log and show generic error message

### Booking Creation Errors
- **Quota exceeded (FREE plan)**: Block booking, show upgrade message
- **Quota exceeded (paid plans)**: Allow booking, calculate overage, show warning
- **Counter increment failure**: Log error, allow booking (fail-open for user experience)

### Subscription Management Errors
- **Invalid plan assignment**: Validate plan exists and is active
- **Overlapping subscriptions**: Prevent creation, show error
- **Expired subscription**: Auto-downgrade to FREE, notify user

### Email Notification Errors
- **Email send failure**: Log error, retry once, continue operation (non-blocking)
- **Report generation failure**: Log error, notify admin via dashboard

## Testing Strategy

### Unit Tests
- Test database functions with various inputs
- Test API routes with mock data
- Test React components in isolation
- Test overage calculation logic
- Test date handling (month boundaries, timezone)

### Property-Based Tests
Each property test should run minimum 100 iterations and reference the design document property.

**Test 1: Court limit enforcement**
- Generate random clubs with random subscription plans
- Attempt to create courts up to and beyond limit
- Verify creation succeeds only when under limit
- **Tag**: Feature: subscription-management, Property 1: Court limit enforcement

**Test 2: Booking count accuracy**
- Generate random bookings and cancellations
- Verify counter matches actual count
- **Tag**: Feature: subscription-management, Property 2: Booking count accuracy

**Test 3: Overage calculation**
- Generate random booking counts exceeding quota
- Verify overage fee calculation
- **Tag**: Feature: subscription-management, Property 3: Overage calculation correctness

**Test 4: Monthly reset**
- Simulate month transitions
- Verify counters reset correctly
- **Tag**: Feature: subscription-management, Property 4: Monthly counter reset

**Test 5: Subscription expiry**
- Generate subscriptions with various expiry dates
- Verify auto-downgrade to FREE
- **Tag**: Feature: subscription-management, Property 5: Subscription expiry handling

### Integration Tests
- Test full booking flow with quota checking
- Test subscription assignment and limit enforcement
- Test monthly report generation and email sending
- Test plan updates and their effect on existing subscriptions

### Manual Testing Checklist
- Admin can create/edit/delete plans
- Admin can assign plans to clubs
- Court creation respects limits
- Booking quota is tracked correctly
- Overage fees are calculated correctly
- Email reports are sent on schedule
- Dashboard displays correct analytics
