-- Add is_verified column to clubs table
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
