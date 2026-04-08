-- Add icon column to club_types table for storing emoji/icon per sport type
ALTER TABLE public.club_types ADD COLUMN IF NOT EXISTS icon TEXT;
