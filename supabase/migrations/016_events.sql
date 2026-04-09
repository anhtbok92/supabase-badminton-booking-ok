-- 016_events.sql
-- Creates events table and adds event_id column to bookings
-- Requirements: 7.1, 7.2

------------------------------------------------------------
-- 1. Events table
-- Requirement 7.1
------------------------------------------------------------
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date TEXT NOT NULL,          -- YYYY-MM-DD format, consistent with bookings.date
  court_id UUID REFERENCES public.courts(id),
  max_participants INTEGER NOT NULL DEFAULT 10,
  ticket_price NUMERIC NOT NULL DEFAULT 0,
  activity_type TEXT,                -- e.g. "Đánh đôi", "Đánh đơn", "Giao lưu"
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'completed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_club_id ON public.events(club_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_status ON public.events(status);

------------------------------------------------------------
-- 2. Add event_id column to bookings table
-- Requirement 7.2
------------------------------------------------------------
ALTER TABLE public.bookings ADD COLUMN event_id UUID REFERENCES public.events(id);
CREATE INDEX idx_bookings_event_id ON public.bookings(event_id);

------------------------------------------------------------
-- 3. Enable RLS on events table
------------------------------------------------------------
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------
-- 4. RLS policies for events
------------------------------------------------------------

-- Public read access (users need to see events to register)
CREATE POLICY "Public read events"
  ON public.events FOR SELECT
  USING (true);

-- Admins or managing club owners can create events
CREATE POLICY "Admins or owners insert events"
  ON public.events FOR INSERT
  WITH CHECK (public.is_admin() OR public.manages_club(club_id));

-- Admins or managing club owners can update events
CREATE POLICY "Admins or owners update events"
  ON public.events FOR UPDATE
  USING (public.is_admin() OR public.manages_club(club_id));

-- Admins or managing club owners can delete events
CREATE POLICY "Admins or owners delete events"
  ON public.events FOR DELETE
  USING (public.is_admin() OR public.manages_club(club_id));
