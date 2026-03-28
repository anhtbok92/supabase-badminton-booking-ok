-- 003_subscription_management.sql
-- Creates subscription management tables and functions
-- Requirements: 1.1, 1.2, 1.3, 2.1, 4.1

------------------------------------------------------------
-- 1. Subscription Plans table
-- Requirement 1.1, 1.2, 1.3
------------------------------------------------------------
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  max_courts INTEGER NOT NULL,
  max_bookings_per_month INTEGER NOT NULL,
  monthly_price INTEGER NOT NULL,
  yearly_price INTEGER NOT NULL,
  overage_fee_per_booking INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_name ON public.subscription_plans(name);
CREATE INDEX idx_subscription_plans_is_active ON public.subscription_plans(is_active);

-- Insert default plans
INSERT INTO public.subscription_plans (
  name, 
  display_name, 
  max_courts, 
  max_bookings_per_month, 
  monthly_price, 
  yearly_price, 
  overage_fee_per_booking, 
  features
) VALUES
(
  'FREE', 
  'Gói Miễn phí', 
  3, 
  100, 
  0, 
  0, 
  0, 
  '{"trial_months": 3, "support": "email"}'::jsonb
),
(
  'BASIC', 
  'Gói Cơ bản', 
  10, 
  1000, 
  200000, 
  2000000, 
  2000, 
  '{"support": "email", "analytics": true}'::jsonb
),
(
  'PRO', 
  'Gói Chuyên nghiệp', 
  30, 
  3000, 
  500000, 
  5000000, 
  1500, 
  '{"support": "priority", "analytics": true, "custom_features": true}'::jsonb
);

------------------------------------------------------------
-- 2. Club Subscriptions table
-- Requirement 2.1
------------------------------------------------------------
CREATE TABLE public.club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  auto_renew BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active subscription per club
CREATE UNIQUE INDEX idx_club_subscriptions_active_unique 
  ON public.club_subscriptions(club_id) 
  WHERE is_active = TRUE;

CREATE INDEX idx_club_subscriptions_club_id ON public.club_subscriptions(club_id);
CREATE INDEX idx_club_subscriptions_active ON public.club_subscriptions(is_active, end_date);
CREATE INDEX idx_club_subscriptions_plan_id ON public.club_subscriptions(plan_id);

------------------------------------------------------------
-- 3. Booking Usage Tracking table
-- Requirement 4.1
------------------------------------------------------------
CREATE TABLE public.booking_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  booking_count INTEGER DEFAULT 0,
  overage_count INTEGER DEFAULT 0,
  overage_fee INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, month)
);

CREATE INDEX idx_booking_usage_club_month ON public.booking_usage_tracking(club_id, month);
CREATE INDEX idx_booking_usage_month ON public.booking_usage_tracking(month);

------------------------------------------------------------
-- 4. Add subscription columns to clubs table
-- Requirement 2.1
------------------------------------------------------------
ALTER TABLE public.clubs 
  ADD COLUMN IF NOT EXISTS current_subscription_id UUID REFERENCES public.club_subscriptions(id),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active' 
    CHECK (subscription_status IN ('active', 'expiring_soon', 'expired'));

CREATE INDEX idx_clubs_subscription_status ON public.clubs(subscription_status);
CREATE INDEX idx_clubs_current_subscription_id ON public.clubs(current_subscription_id);

------------------------------------------------------------
-- 5. Database Function: check_court_limit
-- Requirement 3.1
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_court_limit(p_club_id UUID)
RETURNS TABLE(
  current_count INTEGER,
  max_allowed INTEGER,
  can_create BOOLEAN
) AS $$
DECLARE
  v_current_count INTEGER;
  v_max_allowed INTEGER;
BEGIN
  -- Get current court count
  SELECT COUNT(*)::INTEGER INTO v_current_count
  FROM public.courts
  WHERE club_id = p_club_id;
  
  -- Get max allowed from subscription plan
  SELECT sp.max_courts INTO v_max_allowed
  FROM public.clubs c
  JOIN public.club_subscriptions cs ON c.current_subscription_id = cs.id
  JOIN public.subscription_plans sp ON cs.plan_id = sp.id
  WHERE c.id = p_club_id AND cs.is_active = TRUE;
  
  -- If no subscription, default to FREE plan limits
  IF v_max_allowed IS NULL THEN
    SELECT max_courts INTO v_max_allowed
    FROM public.subscription_plans
    WHERE name = 'FREE';
  END IF;
  
  RETURN QUERY SELECT 
    v_current_count, 
    v_max_allowed, 
    (v_current_count < v_max_allowed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

------------------------------------------------------------
-- 6. Database Function: check_booking_quota
-- Requirement 4.1
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_booking_quota(p_club_id UUID)
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
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  -- Get current booking count for this month
  SELECT COALESCE(booking_count, 0)::INTEGER INTO v_current_count
  FROM public.booking_usage_tracking
  WHERE club_id = p_club_id AND month = v_current_month;
  
  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;
  
  -- Get max allowed and overage fee from subscription plan
  SELECT sp.max_bookings_per_month, sp.overage_fee_per_booking
  INTO v_max_allowed, v_overage_fee_rate
  FROM public.clubs c
  JOIN public.club_subscriptions cs ON c.current_subscription_id = cs.id
  JOIN public.subscription_plans sp ON cs.plan_id = sp.id
  WHERE c.id = p_club_id AND cs.is_active = TRUE;
  
  -- If no subscription, default to FREE plan
  IF v_max_allowed IS NULL THEN
    SELECT max_bookings_per_month, overage_fee_per_booking
    INTO v_max_allowed, v_overage_fee_rate
    FROM public.subscription_plans
    WHERE name = 'FREE';
  END IF;
  
  RETURN QUERY SELECT
    v_current_count,
    v_max_allowed,
    GREATEST(0, v_current_count - v_max_allowed)::INTEGER AS overage_count,
    (GREATEST(0, v_current_count - v_max_allowed) * v_overage_fee_rate)::INTEGER AS overage_fee,
    ROUND((v_current_count::NUMERIC / NULLIF(v_max_allowed, 0)::NUMERIC) * 100, 2) AS usage_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

------------------------------------------------------------
-- 7. Database Function: increment_booking_count
-- Requirement 4.1
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_booking_count(p_club_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_month DATE;
  v_max_allowed INTEGER;
  v_overage_fee_rate INTEGER;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  -- Get plan limits
  SELECT sp.max_bookings_per_month, sp.overage_fee_per_booking
  INTO v_max_allowed, v_overage_fee_rate
  FROM public.clubs c
  JOIN public.club_subscriptions cs ON c.current_subscription_id = cs.id
  JOIN public.subscription_plans sp ON cs.plan_id = sp.id
  WHERE c.id = p_club_id AND cs.is_active = TRUE;
  
  -- If no subscription, use FREE plan limits
  IF v_max_allowed IS NULL THEN
    SELECT max_bookings_per_month, overage_fee_per_booking
    INTO v_max_allowed, v_overage_fee_rate
    FROM public.subscription_plans
    WHERE name = 'FREE';
  END IF;
  
  -- Insert or update booking count
  INSERT INTO public.booking_usage_tracking (
    club_id, 
    month, 
    booking_count, 
    overage_count, 
    overage_fee
  )
  VALUES (
    p_club_id, 
    v_current_month, 
    1, 
    GREATEST(0, 1 - v_max_allowed), 
    GREATEST(0, 1 - v_max_allowed) * v_overage_fee_rate
  )
  ON CONFLICT (club_id, month)
  DO UPDATE SET
    booking_count = public.booking_usage_tracking.booking_count + 1,
    overage_count = GREATEST(0, public.booking_usage_tracking.booking_count + 1 - v_max_allowed),
    overage_fee = GREATEST(0, public.booking_usage_tracking.booking_count + 1 - v_max_allowed) * v_overage_fee_rate,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

------------------------------------------------------------
-- 8. Database Function: decrement_booking_count
-- Helper function for booking cancellations
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_booking_count(p_club_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_month DATE;
  v_max_allowed INTEGER;
  v_overage_fee_rate INTEGER;
  v_current_count INTEGER;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  -- Get plan limits
  SELECT sp.max_bookings_per_month, sp.overage_fee_per_booking
  INTO v_max_allowed, v_overage_fee_rate
  FROM public.clubs c
  JOIN public.club_subscriptions cs ON c.current_subscription_id = cs.id
  JOIN public.subscription_plans sp ON cs.plan_id = sp.id
  WHERE c.id = p_club_id AND cs.is_active = TRUE;
  
  -- If no subscription, use FREE plan limits
  IF v_max_allowed IS NULL THEN
    SELECT max_bookings_per_month, overage_fee_per_booking
    INTO v_max_allowed, v_overage_fee_rate
    FROM public.subscription_plans
    WHERE name = 'FREE';
  END IF;
  
  -- Get current count
  SELECT booking_count INTO v_current_count
  FROM public.booking_usage_tracking
  WHERE club_id = p_club_id AND month = v_current_month;
  
  -- Only decrement if count exists and is greater than 0
  IF v_current_count IS NOT NULL AND v_current_count > 0 THEN
    UPDATE public.booking_usage_tracking
    SET
      booking_count = booking_count - 1,
      overage_count = GREATEST(0, booking_count - 1 - v_max_allowed),
      overage_fee = GREATEST(0, booking_count - 1 - v_max_allowed) * v_overage_fee_rate,
      updated_at = NOW()
    WHERE club_id = p_club_id AND month = v_current_month;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

------------------------------------------------------------
-- 9. Trigger to update updated_at timestamp
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_club_subscriptions_updated_at
  BEFORE UPDATE ON public.club_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_usage_tracking_updated_at
  BEFORE UPDATE ON public.booking_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
