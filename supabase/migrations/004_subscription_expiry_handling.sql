-- 004_subscription_expiry_handling.sql
-- Creates functions for handling subscription expiry and notifications
-- Requirements: 2.5, 6.1, 6.2

------------------------------------------------------------
-- 1. Function: get_expiring_subscriptions
-- Returns subscriptions expiring in the next 7 days
-- Requirement 6.1
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_expiring_subscriptions()
RETURNS TABLE(
  subscription_id UUID,
  club_id UUID,
  club_name VARCHAR,
  club_owner_email VARCHAR,
  plan_name VARCHAR,
  end_date DATE,
  days_until_expiry INTEGER
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    cs.id AS subscription_id,
    c.id AS club_id,
    c.name AS club_name,
    p.email AS club_owner_email,
    sp.display_name AS plan_name,
    cs.end_date,
    (cs.end_date - CURRENT_DATE)::INTEGER AS days_until_expiry
  FROM public.club_subscriptions cs
  JOIN public.clubs c ON cs.club_id = c.id
  JOIN public.subscription_plans sp ON cs.plan_id = sp.id
  LEFT JOIN public.profiles p ON c.owner_id = p.id
  WHERE cs.is_active = TRUE
    AND cs.end_date > CURRENT_DATE
    AND cs.end_date <= CURRENT_DATE + INTERVAL '7 days'
  ORDER BY cs.end_date ASC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

------------------------------------------------------------
-- 2. Function: get_expired_subscriptions
-- Returns subscriptions that have expired (end_date < today)
-- Requirement 2.5, 6.2
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_expired_subscriptions()
RETURNS TABLE(
  subscription_id UUID,
  club_id UUID,
  club_name VARCHAR,
  club_owner_email VARCHAR,
  plan_name VARCHAR,
  end_date DATE,
  days_since_expiry INTEGER
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    cs.id AS subscription_id,
    c.id AS club_id,
    c.name AS club_name,
    p.email AS club_owner_email,
    sp.display_name AS plan_name,
    cs.end_date,
    (CURRENT_DATE - cs.end_date)::INTEGER AS days_since_expiry
  FROM public.club_subscriptions cs
  JOIN public.clubs c ON cs.club_id = c.id
  JOIN public.subscription_plans sp ON cs.plan_id = sp.id
  LEFT JOIN public.profiles p ON c.owner_id = p.id
  WHERE cs.is_active = TRUE
    AND cs.end_date < CURRENT_DATE
  ORDER BY cs.end_date ASC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

------------------------------------------------------------
-- 3. Function: downgrade_expired_subscription
-- Downgrades an expired subscription to FREE plan
-- Requirement 2.5
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.downgrade_expired_subscription(p_club_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  old_subscription_id UUID,
  new_subscription_id UUID
) AS $
DECLARE
  v_old_subscription_id UUID;
  v_new_subscription_id UUID;
  v_free_plan_id UUID;
  v_club_name VARCHAR;
BEGIN
  -- Get club name for logging
  SELECT name INTO v_club_name
  FROM public.clubs
  WHERE id = p_club_id;

  -- Get FREE plan ID
  SELECT id INTO v_free_plan_id
  FROM public.subscription_plans
  WHERE name = 'FREE';

  IF v_free_plan_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE, 
      'FREE plan not found in database'::TEXT,
      NULL::UUID,
      NULL::UUID;
    RETURN;
  END IF;

  -- Get current active subscription
  SELECT id INTO v_old_subscription_id
  FROM public.club_subscriptions
  WHERE club_id = p_club_id 
    AND is_active = TRUE;

  IF v_old_subscription_id IS NULL THEN
    RETURN QUERY SELECT 
      FALSE, 
      'No active subscription found for club'::TEXT,
      NULL::UUID,
      NULL::UUID;
    RETURN;
  END IF;

  -- Deactivate old subscription
  UPDATE public.club_subscriptions
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE id = v_old_subscription_id;

  -- Create new FREE subscription (3 months)
  INSERT INTO public.club_subscriptions (
    club_id,
    plan_id,
    billing_cycle,
    start_date,
    end_date,
    is_active,
    auto_renew
  ) VALUES (
    p_club_id,
    v_free_plan_id,
    'monthly',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 months',
    TRUE,
    FALSE
  )
  RETURNING id INTO v_new_subscription_id;

  -- Update club's current subscription and status
  UPDATE public.clubs
  SET current_subscription_id = v_new_subscription_id,
      subscription_status = 'active',
      updated_at = NOW()
  WHERE id = p_club_id;

  -- Log the downgrade
  RAISE NOTICE 'Club % (%) downgraded to FREE plan. Old subscription: %, New subscription: %',
    v_club_name, p_club_id, v_old_subscription_id, v_new_subscription_id;

  RETURN QUERY SELECT 
    TRUE, 
    'Successfully downgraded to FREE plan'::TEXT,
    v_old_subscription_id,
    v_new_subscription_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

------------------------------------------------------------
-- 4. Function: update_subscription_status
-- Updates club subscription_status based on end_date
-- Requirement 6.1
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_subscription_status(p_club_id UUID)
RETURNS TEXT AS $
DECLARE
  v_end_date DATE;
  v_days_until_expiry INTEGER;
  v_new_status VARCHAR(20);
BEGIN
  -- Get active subscription end date
  SELECT cs.end_date INTO v_end_date
  FROM public.club_subscriptions cs
  WHERE cs.club_id = p_club_id 
    AND cs.is_active = TRUE;

  IF v_end_date IS NULL THEN
    -- No active subscription, set to expired
    UPDATE public.clubs
    SET subscription_status = 'expired',
        updated_at = NOW()
    WHERE id = p_club_id;
    RETURN 'expired';
  END IF;

  -- Calculate days until expiry
  v_days_until_expiry := (v_end_date - CURRENT_DATE)::INTEGER;

  -- Determine status
  IF v_days_until_expiry < 0 THEN
    v_new_status := 'expired';
  ELSIF v_days_until_expiry <= 7 THEN
    v_new_status := 'expiring_soon';
  ELSE
    v_new_status := 'active';
  END IF;

  -- Update club status
  UPDATE public.clubs
  SET subscription_status = v_new_status,
      updated_at = NOW()
  WHERE id = p_club_id;

  RETURN v_new_status;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

------------------------------------------------------------
-- 5. Function: process_all_subscription_expiries
-- Main function to process all expiring/expired subscriptions
-- Called by cron job
-- Requirements: 2.5, 6.1, 6.2
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_all_subscription_expiries()
RETURNS TABLE(
  total_expiring INTEGER,
  total_expired INTEGER,
  total_downgraded INTEGER,
  expiring_clubs JSONB,
  expired_clubs JSONB,
  downgrade_results JSONB
) AS $
DECLARE
  v_expiring_count INTEGER;
  v_expired_count INTEGER;
  v_downgraded_count INTEGER;
  v_expiring_data JSONB;
  v_expired_data JSONB;
  v_downgrade_data JSONB := '[]'::JSONB;
  v_club RECORD;
  v_downgrade_result RECORD;
BEGIN
  -- Get expiring subscriptions (7 days warning)
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(jsonb_agg(jsonb_build_object(
      'club_id', subscription_id,
      'club_name', club_name,
      'club_owner_email', club_owner_email,
      'plan_name', plan_name,
      'end_date', end_date,
      'days_until_expiry', days_until_expiry
    )), '[]'::JSONB)
  INTO v_expiring_count, v_expiring_data
  FROM public.get_expiring_subscriptions();

  -- Get expired subscriptions
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(jsonb_agg(jsonb_build_object(
      'subscription_id', subscription_id,
      'club_id', club_id,
      'club_name', club_name,
      'club_owner_email', club_owner_email,
      'plan_name', plan_name,
      'end_date', end_date,
      'days_since_expiry', days_since_expiry
    )), '[]'::JSONB)
  INTO v_expired_count, v_expired_data
  FROM public.get_expired_subscriptions();

  -- Process expired subscriptions (downgrade to FREE)
  v_downgraded_count := 0;
  
  FOR v_club IN 
    SELECT club_id, club_name 
    FROM public.get_expired_subscriptions()
  LOOP
    -- Downgrade each expired subscription
    SELECT * INTO v_downgrade_result
    FROM public.downgrade_expired_subscription(v_club.club_id);

    IF v_downgrade_result.success THEN
      v_downgraded_count := v_downgraded_count + 1;
      
      -- Add to results
      v_downgrade_data := v_downgrade_data || jsonb_build_object(
        'club_id', v_club.club_id,
        'club_name', v_club.club_name,
        'success', TRUE,
        'message', v_downgrade_result.message,
        'old_subscription_id', v_downgrade_result.old_subscription_id,
        'new_subscription_id', v_downgrade_result.new_subscription_id
      );
    ELSE
      -- Log failure
      v_downgrade_data := v_downgrade_data || jsonb_build_object(
        'club_id', v_club.club_id,
        'club_name', v_club.club_name,
        'success', FALSE,
        'message', v_downgrade_result.message
      );
    END IF;
  END LOOP;

  -- Update subscription status for all clubs with expiring subscriptions
  FOR v_club IN 
    SELECT club_id 
    FROM public.get_expiring_subscriptions()
  LOOP
    PERFORM public.update_subscription_status(v_club.club_id);
  END LOOP;

  -- Return summary
  RETURN QUERY SELECT
    v_expiring_count,
    v_expired_count,
    v_downgraded_count,
    v_expiring_data,
    v_expired_data,
    v_downgrade_data;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

------------------------------------------------------------
-- 6. Grant execute permissions
------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_expiring_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expired_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.downgrade_expired_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_all_subscription_expiries() TO authenticated;

