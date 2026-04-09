-- 017_event_time_slots.sql
-- Adds start_time and end_time columns to events table
-- so that event bookings block the correct time slots on the visual booking grid

ALTER TABLE public.events ADD COLUMN start_time TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE public.events ADD COLUMN end_time TEXT NOT NULL DEFAULT '10:00';
