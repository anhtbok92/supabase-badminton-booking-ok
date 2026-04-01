-- 005_fix_rls_vulnerabilities.sql
-- Addresses Supabase lint errors "RLS Disabled in Public"
-- Tables: User, Club, Court, Booking, NewsArticle, NewsTag, ClubType, 
--         club_subscriptions, subscription_plans, booking_usage_tracking

------------------------------------------------------------
-- 1. Enable RLS on Reported Tables
------------------------------------------------------------

-- Enable RLS on snake_case tables from 003 (if not already enabled)
ALTER TABLE IF EXISTS public.club_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Enable RLS on PascalCase tables (reported by linter)
-- We use DO blocks to avoid errors if these tables are defunct or don't exist
DO $$
BEGIN
    ALTER TABLE IF EXISTS public."User" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."Club" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."Court" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."Booking" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."NewsArticle" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."NewsTag" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public."ClubType" ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some PascalCase tables were not found or could not be updated.';
END $$;

------------------------------------------------------------
-- 2. Define Policies for Subscription Tables (from 003)
------------------------------------------------------------

-- subscription_plans: Anyone can read
DROP POLICY IF EXISTS "Public read subscription_plans" ON public.subscription_plans;
CREATE POLICY "Public read subscription_plans" ON public.subscription_plans
    FOR SELECT USING (true);

-- subscription_plans: Only admins can manage
DROP POLICY IF EXISTS "Admins manage subscription_plans" ON public.subscription_plans;
CREATE POLICY "Admins manage subscription_plans" ON public.subscription_plans
    FOR ALL USING (public.is_admin());

-- club_subscriptions: Owners can read their own club's subscription
DROP POLICY IF EXISTS "Owners read managed club subscriptions" ON public.club_subscriptions;
CREATE POLICY "Owners read managed club subscriptions" ON public.club_subscriptions
    FOR SELECT USING (public.is_admin() OR public.manages_club(club_id::uuid));

-- club_subscriptions: Only admins can manage
DROP POLICY IF EXISTS "Admins manage club_subscriptions" ON public.club_subscriptions;
CREATE POLICY "Admins manage club_subscriptions" ON public.club_subscriptions
    FOR ALL USING (public.is_admin());

-- booking_usage_tracking: Owners can read their own club's usage
DROP POLICY IF EXISTS "Owners read managed club usage" ON public.booking_usage_tracking;
CREATE POLICY "Owners read managed club usage" ON public.booking_usage_tracking
    FOR SELECT USING (public.is_admin() OR public.manages_club(club_id::uuid));

-- booking_usage_tracking: Only admins can manage (or system functions via SECURITY DEFINER)
DROP POLICY IF EXISTS "Admins manage booking_usage_tracking" ON public.booking_usage_tracking;
CREATE POLICY "Admins manage booking_usage_tracking" ON public.booking_usage_tracking
    FOR ALL USING (public.is_admin());

------------------------------------------------------------
-- 3. Define Policies for PascalCase Tables (Mirror Plural Policies)
------------------------------------------------------------

-- Check if User table exists and apply policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
        -- Profile access
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Users can read own profile') THEN
            CREATE POLICY "Users can read own profile" ON public."User" FOR SELECT USING (auth.uid()::text = id::text OR public.is_admin());
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Users can update own profile') THEN
            CREATE POLICY "Users can update own profile" ON public."User" FOR UPDATE USING (auth.uid()::text = id::text OR public.is_admin());
        END IF;
    END IF;
END $$;

-- Check if Club table exists and apply policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Club') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Club' AND policyname = 'Public read clubs') THEN
            CREATE POLICY "Public read clubs" ON public."Club" FOR SELECT USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Club' AND policyname = 'Admins or owners update clubs') THEN
            CREATE POLICY "Admins or owners update clubs" ON public."Club" FOR UPDATE USING (public.is_admin() OR public.manages_club(id::uuid));
        END IF;
    END IF;
END $$;

-- Check if Court table exists and apply policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Court') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Court' AND policyname = 'Public read courts') THEN
            CREATE POLICY "Public read courts" ON public."Court" FOR SELECT USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Court' AND policyname = 'Admins or owners manage courts') THEN
            CREATE POLICY "Admins or owners manage courts" ON public."Court" FOR ALL USING (public.is_admin() OR public.manages_club("clubId"::uuid));
        END IF;
    END IF;
END $$;

-- Check if Booking table exists and apply policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Booking') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Booking' AND policyname = 'Public read bookings') THEN
            CREATE POLICY "Public read bookings" ON public."Booking" FOR SELECT USING (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Booking' AND policyname = 'Anyone can create bookings') THEN
            CREATE POLICY "Anyone can create bookings" ON public."Booking" FOR INSERT WITH CHECK (true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Booking' AND policyname = 'Admins or owners manage bookings') THEN
            CREATE POLICY "Admins or owners manage bookings" ON public."Booking" FOR ALL USING (public.is_admin() OR public.manages_club("clubId"::uuid));
        END IF;
    END IF;
END $$;

-- Check if NewsArticle/NewsTag/ClubType exist and apply policies
DO $$
BEGIN
    -- NewsArticle
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'NewsArticle') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NewsArticle' AND policyname = 'Public read news') THEN
            CREATE POLICY "Public read news" ON public."NewsArticle" FOR SELECT USING (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NewsArticle' AND policyname = 'Admins manage news') THEN
            CREATE POLICY "Admins manage news" ON public."NewsArticle" FOR ALL USING (public.is_admin());
        END IF;
    END IF;

    -- NewsTag
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'NewsTag') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NewsTag' AND policyname = 'Public read news_tags') THEN
            CREATE POLICY "Public read news_tags" ON public."NewsTag" FOR SELECT USING (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NewsTag' AND policyname = 'Admins manage news_tags') THEN
            CREATE POLICY "Admins manage news_tags" ON public."NewsTag" FOR ALL USING (public.is_admin());
        END IF;
    END IF;

    -- ClubType
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ClubType') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ClubType' AND policyname = 'Public read club_types') THEN
            CREATE POLICY "Public read club_types" ON public."ClubType" FOR SELECT USING (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ClubType' AND policyname = 'Admins manage club_types') THEN
            CREATE POLICY "Admins manage club_types" ON public."ClubType" FOR ALL USING (public.is_admin());
        END IF;
    END IF;
END $$;
