-- 001_initial_schema.sql
-- Creates all 7 tables for the badminton court booking system
-- Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7

------------------------------------------------------------
-- 1. Users table (synced with Supabase Auth)
-- Requirement 3.1
------------------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('admin', 'club_owner', 'staff', 'customer')),
  managed_club_ids UUID[] DEFAULT '{}',
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_phone ON public.users(phone);

------------------------------------------------------------
-- 2. Clubs table
-- Requirement 3.2
------------------------------------------------------------
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  rating NUMERIC,
  image_urls TEXT[] DEFAULT '{}',
  pricing JSONB DEFAULT '{}',
  operating_hours TEXT,
  services_html TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  club_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  payment_qr_url TEXT,
  price_list_html TEXT,
  price_list_image_url TEXT,
  map_video_url TEXT,
  verification_status TEXT DEFAULT 'approved',
  owner_name TEXT,
  owner_phone TEXT,
  number_of_courts INTEGER,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clubs_is_active ON public.clubs(is_active);
CREATE INDEX idx_clubs_club_type ON public.clubs(club_type);
CREATE INDEX idx_clubs_owner_id ON public.clubs(owner_id);


------------------------------------------------------------
-- 3. Courts table (replaces Firestore subcollection clubs/{id}/courts)
-- Requirement 3.3
------------------------------------------------------------
CREATE TABLE public.courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_urls TEXT[] DEFAULT '{}',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courts_club_id ON public.courts(club_id);

------------------------------------------------------------
-- 4. Bookings table
-- Requirement 3.4
------------------------------------------------------------
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  club_id UUID NOT NULL REFERENCES public.clubs(id),
  club_name TEXT,
  date TEXT NOT NULL,
  slots JSONB NOT NULL DEFAULT '[]',
  total_price NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Chờ xác nhận',
  name TEXT,
  phone TEXT,
  payment_proof_image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  booking_group_id TEXT
);

CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_club_id ON public.bookings(club_id);
CREATE INDEX idx_bookings_date ON public.bookings(date);
CREATE INDEX idx_bookings_club_date ON public.bookings(club_id, date);
CREATE INDEX idx_bookings_status ON public.bookings(status);

------------------------------------------------------------
-- 5. News table
-- Requirement 3.5
------------------------------------------------------------
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_description TEXT,
  content_html TEXT,
  banner_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_created_at ON public.news(created_at DESC);

------------------------------------------------------------
-- 6. News Tags table
-- Requirement 3.6
------------------------------------------------------------
CREATE TABLE public.news_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

------------------------------------------------------------
-- 7. Club Types table
-- Requirement 3.7
------------------------------------------------------------
CREATE TABLE public.club_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0
);

CREATE INDEX idx_club_types_order ON public.club_types("order");
