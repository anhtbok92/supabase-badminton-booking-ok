-- Add color column to club_types table
ALTER TABLE public.club_types ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#00e640';

-- Update existing types if any to have a default color
UPDATE public.club_types SET color = '#00e640' WHERE color IS NULL;
