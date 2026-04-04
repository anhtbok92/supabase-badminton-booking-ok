DROP FUNCTION IF EXISTS public.check_booking_quota(UUID);

CREATE OR REPLACE FUNCTION public.check_booking_quota(p_club_id UUID)
RETURNS TABLE(
  current_count INTEGER,
  max_allowed INTEGER,
  overage_count INTEGER,
  overage_fee INTEGER,
  usage_percentage NUMERIC,
  month_label TEXT
) AS $$
DECLARE
  v_current_month_start DATE;
  v_next_month_start DATE;
  v_current_count INTEGER;
  v_max_allowed INTEGER;
  v_overage_fee_rate INTEGER;
BEGIN
  v_current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_next_month_start := (v_current_month_start + INTERVAL '1 month')::DATE;
  
  -- Lay so luong booking thuc te trong thang nay
  SELECT COUNT(*)::INTEGER INTO v_current_count
  FROM public.bookings
  WHERE club_id = p_club_id 
    AND date >= v_current_month_start::TEXT 
    AND date < v_next_month_start::TEXT
    AND is_deleted = FALSE;
  
  -- Lay gioi han goi tu dang ky hien tai
  SELECT sp.max_bookings_per_month, sp.overage_fee_per_booking
  INTO v_max_allowed, v_overage_fee_rate
  FROM public.clubs c
  JOIN public.club_subscriptions cs ON c.current_subscription_id = cs.id
  JOIN public.subscription_plans sp ON cs.plan_id = sp.id
  WHERE c.id = p_club_id AND cs.is_active = TRUE;
  
  -- Mac dinh goi FREE
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
    ROUND((v_current_count::NUMERIC / NULLIF(v_max_allowed, 0)::NUMERIC) * 100, 2) AS usage_percentage,
    TO_CHAR(v_current_month_start, 'MM/YYYY') AS month_label;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;