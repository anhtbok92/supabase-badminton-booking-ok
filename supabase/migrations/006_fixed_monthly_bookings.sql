-- 006_fixed_monthly_bookings.sql
-- Table and functions for fixed monthly booking feature

------------------------------------------------------------
-- 1. Fixed Monthly Configurations table
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fixed_monthly_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL, -- Format 'HH:mm'
  end_time TEXT NOT NULL,   -- Format 'HH:mm'
  customer_name TEXT,
  customer_phone TEXT,
  total_price NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_auto_renew BOOLEAN DEFAULT TRUE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance (will only be created if not exists)
CREATE INDEX IF NOT EXISTS idx_fixed_configs_club_id ON public.fixed_monthly_configs(club_id);
CREATE INDEX IF NOT EXISTS idx_fixed_configs_is_active ON public.fixed_monthly_configs(is_active);

------------------------------------------------------------
-- 2. Row Level Security (RLS) policies
------------------------------------------------------------
ALTER TABLE public.fixed_monthly_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all fixed configs' AND tablename = 'fixed_monthly_configs'
    ) THEN
        CREATE POLICY "Admins can manage all fixed configs"
          ON public.fixed_monthly_configs
          FOR ALL
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() AND users.role = 'admin'
            )
          );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Club owners can manage their club''s fixed configs' AND tablename = 'fixed_monthly_configs'
    ) THEN
        CREATE POLICY "Club owners can manage their club's fixed configs"
          ON public.fixed_monthly_configs
          FOR ALL
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM public.users
              WHERE users.id = auth.uid() 
              AND (users.role = 'club_owner' OR users.role = 'staff')
              AND fixed_monthly_configs.club_id = ANY(users.managed_club_ids)
            )
          );
    END IF;
END $$;

------------------------------------------------------------
-- 3. Function to generate bookings from fixed configs
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_monthly_bookings(
  p_club_id UUID,
  p_year_month TEXT -- Format 'YYYY-MM'
)
RETURNS TABLE (
  total_created INTEGER,
  total_skipped INTEGER,
  details JSONB
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_curr_date DATE;
  v_day_of_week INTEGER;
  v_config RECORD;
  v_slot_time TEXT;
  v_created_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_details JSONB := '[]'::JSONB;
  v_slots_to_insert JSONB;
  v_club_name TEXT;
  v_court_name TEXT;
  v_overlapping_exists BOOLEAN;
  v_time_slot_interval INTERVAL := '30 minutes';
  v_temp_start_time TIME;
  v_temp_end_time TIME;
BEGIN
  -- Validate input
  IF p_year_month !~ '^\d{4}-\d{2}$' THEN
    RAISE EXCEPTION 'Invalid month format. Expected YYYY-MM';
  END IF;

  v_start_date := (p_year_month || '-01')::DATE;
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Get club name
  SELECT name INTO v_club_name FROM public.clubs WHERE id = p_club_id;

  -- Loop through each day of the month
  v_curr_date := v_start_date;
  WHILE v_curr_date <= v_end_date LOOP
    -- EXTRACT DOW returns 0=Sunday, 6=Saturday
    v_day_of_week := EXTRACT(DOW FROM v_curr_date)::INTEGER;

    -- Find configurations for this day of week
    for v_config IN 
      SELECT * FROM public.fixed_monthly_configs 
      WHERE club_id = p_club_id 
        AND day_of_week = v_day_of_week 
        AND is_active = TRUE
    LOOP
      -- Get court name
      SELECT name INTO v_court_name FROM public.courts WHERE id = v_config.court_id;

      -- Construct slots array for this configuration
      v_slots_to_insert := '[]'::JSONB;
      v_temp_start_time := v_config.start_time::TIME;
      v_temp_end_time := v_config.end_time::TIME;
      
      WHILE v_temp_start_time < v_temp_end_time LOOP
        v_slot_time := to_char(v_temp_start_time, 'HH24:mi');
        
        v_slots_to_insert := v_slots_to_insert || jsonb_build_object(
          'court_id', v_config.court_id,
          'time', v_slot_time,
          'court_name', v_court_name
        );
        
        v_temp_start_time := v_temp_start_time + v_time_slot_interval;
      END LOOP;

      -- Check for overlapping bookings
      -- We check if ANY slot in our new booking overlaps with ANY slot in existing bookings for that day
      SELECT EXISTS (
        SELECT 1 
        FROM public.bookings b,
             jsonb_array_elements(b.slots) as existing_slot
        WHERE b.club_id = p_club_id 
          AND b.date = v_curr_date::TEXT
          AND b.status != 'Đã hủy'
          AND b.is_deleted = FALSE
          AND (existing_slot->>'court_id') = v_config.court_id::TEXT
          AND (existing_slot->>'time') IN (
            SELECT (jsonb_array_elements(v_slots_to_insert)->>'time')
          )
      ) INTO v_overlapping_exists;

      IF NOT v_overlapping_exists THEN
        -- Create booking
        INSERT INTO public.bookings (
          club_id,
          club_name,
          date,
          slots,
          total_price,
          status,
          name,
          phone,
          booking_group_id
        ) VALUES (
          p_club_id,
          v_club_name,
          v_curr_date::TEXT,
          v_slots_to_insert,
          v_config.total_price,
          'Đã xác nhận',
          v_config.customer_name,
          v_config.customer_phone,
          'FIXED-' || v_config.id::TEXT || '-' || p_year_month
        );
        
        v_created_count := v_created_count + 1;
      ELSE
        v_skipped_count := v_skipped_count + 1;
        v_details := v_details || jsonb_build_object(
          'date', v_curr_date,
          'config_id', v_config.id,
          'reason', 'Overlapping booking exists'
        );
      END IF;
    END LOOP;

    v_curr_date := v_curr_date + INTERVAL '1 day';
  END LOOP;

  RETURN QUERY SELECT v_created_count, v_skipped_count, v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

------------------------------------------------------------
-- 4. Grant permissions
------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.generate_monthly_bookings(UUID, TEXT) TO authenticated;
