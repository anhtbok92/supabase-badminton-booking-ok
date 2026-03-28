-- 002_rls_policies.sql
-- Enable RLS and define access policies for all tables
-- Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9

------------------------------------------------------------
-- Enable RLS on all tables
------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_types ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------
-- Helper functions
------------------------------------------------------------

-- Get the role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if the currently authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if the currently authenticated user manages a specific club
-- Requirement 4.9
CREATE OR REPLACE FUNCTION public.manages_club(club_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'club_owner'
      AND club_uuid = ANY(managed_club_ids)
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get managed_club_ids of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_managed_club_ids()
RETURNS UUID[] AS $
  SELECT COALESCE(managed_club_ids, '{}') FROM public.users WHERE id = auth.uid()
$ LANGUAGE sql SECURITY DEFINER STABLE;

------------------------------------------------------------
-- USERS policies
-- Requirements: 4.3, 4.4
------------------------------------------------------------

-- Users can read their own profile, admins can read all (Req 4.3)
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can update their own profile, admins can update all (Req 4.3)
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- Admins can insert users, or user can insert their own row on registration
CREATE POLICY "Admins or self insert users"
  ON public.users FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() = id);

-- Admins can list all users (Req 4.4)
-- Note: The SELECT policy above already covers admin access via is_admin() check

-- Club owners can read staff/users who share managed clubs
CREATE POLICY "Club owners can read managed staff"
  ON public.users FOR SELECT
  USING (
    public.get_user_role() = 'club_owner'
    AND managed_club_ids && public.get_managed_club_ids()
  );

-- Club owners can update staff who share managed clubs
CREATE POLICY "Club owners can update managed staff"
  ON public.users FOR UPDATE
  USING (
    public.get_user_role() = 'club_owner'
    AND role IN ('staff')
    AND managed_club_ids && public.get_managed_club_ids()
  );

------------------------------------------------------------
-- CLUBS policies
-- Requirements: 4.1
------------------------------------------------------------

-- Public read access (Req 4.1)
CREATE POLICY "Public read clubs"
  ON public.clubs FOR SELECT
  USING (true);

-- Admins can create clubs; anyone can submit pending registration
CREATE POLICY "Admins create clubs"
  ON public.clubs FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (verification_status = 'pending' AND is_active = false)
  );

-- Admins or managing club owners can update clubs (Req 4.9)
CREATE POLICY "Admins or owners update clubs"
  ON public.clubs FOR UPDATE
  USING (public.is_admin() OR public.manages_club(id));

-- Only admins can delete clubs
CREATE POLICY "Admins delete clubs"
  ON public.clubs FOR DELETE
  USING (public.is_admin());

------------------------------------------------------------
-- COURTS policies
-- Requirements: 4.1, 4.8, 4.9
------------------------------------------------------------

-- Public read access (Req 4.1)
CREATE POLICY "Public read courts"
  ON public.courts FOR SELECT
  USING (true);

-- Admins or managing club owners can insert courts (Req 4.8)
CREATE POLICY "Admins or owners insert courts"
  ON public.courts FOR INSERT
  WITH CHECK (public.is_admin() OR public.manages_club(club_id));

-- Admins or managing club owners can update courts (Req 4.8)
CREATE POLICY "Admins or owners update courts"
  ON public.courts FOR UPDATE
  USING (public.is_admin() OR public.manages_club(club_id));

-- Admins or managing club owners can delete courts (Req 4.8)
CREATE POLICY "Admins or owners delete courts"
  ON public.courts FOR DELETE
  USING (public.is_admin() OR public.manages_club(club_id));

------------------------------------------------------------
-- BOOKINGS policies
-- Requirements: 4.2, 4.5, 4.6
------------------------------------------------------------

-- Public read access for checking availability (Req 4.2)
CREATE POLICY "Public read bookings"
  ON public.bookings FOR SELECT
  USING (true);

-- Anyone can create a booking (Req 4.5)
CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

-- Only admins or managing club owners can update bookings (Req 4.6)
CREATE POLICY "Admins or owners update bookings"
  ON public.bookings FOR UPDATE
  USING (public.is_admin() OR public.manages_club(club_id));

-- Only admins or managing club owners can delete bookings (Req 4.6)
CREATE POLICY "Admins or owners delete bookings"
  ON public.bookings FOR DELETE
  USING (public.is_admin() OR public.manages_club(club_id));

------------------------------------------------------------
-- NEWS policies
-- Requirements: 4.1, 4.7
------------------------------------------------------------

-- Public read access (Req 4.1)
CREATE POLICY "Public read news"
  ON public.news FOR SELECT
  USING (true);

-- Only admins can insert news (Req 4.7)
CREATE POLICY "Admins insert news"
  ON public.news FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update news (Req 4.7)
CREATE POLICY "Admins update news"
  ON public.news FOR UPDATE
  USING (public.is_admin());

-- Only admins can delete news (Req 4.7)
CREATE POLICY "Admins delete news"
  ON public.news FOR DELETE
  USING (public.is_admin());

------------------------------------------------------------
-- NEWS_TAGS policies
-- Requirements: 4.1, 4.7
------------------------------------------------------------

-- Public read access (Req 4.1)
CREATE POLICY "Public read news_tags"
  ON public.news_tags FOR SELECT
  USING (true);

-- Only admins can insert news_tags (Req 4.7)
CREATE POLICY "Admins insert news_tags"
  ON public.news_tags FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update news_tags (Req 4.7)
CREATE POLICY "Admins update news_tags"
  ON public.news_tags FOR UPDATE
  USING (public.is_admin());

-- Only admins can delete news_tags (Req 4.7)
CREATE POLICY "Admins delete news_tags"
  ON public.news_tags FOR DELETE
  USING (public.is_admin());

------------------------------------------------------------
-- CLUB_TYPES policies
-- Requirements: 4.1, 4.7
------------------------------------------------------------

-- Public read access (Req 4.1)
CREATE POLICY "Public read club_types"
  ON public.club_types FOR SELECT
  USING (true);

-- Only admins can insert club_types (Req 4.7)
CREATE POLICY "Admins insert club_types"
  ON public.club_types FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update club_types (Req 4.7)
CREATE POLICY "Admins update club_types"
  ON public.club_types FOR UPDATE
  USING (public.is_admin());

-- Only admins can delete club_types (Req 4.7)
CREATE POLICY "Admins delete club_types"
  ON public.club_types FOR DELETE
  USING (public.is_admin());
