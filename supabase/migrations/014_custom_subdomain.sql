-- 014_custom_subdomain.sql
-- Adds custom_subdomain column to clubs table for multi-tenant subdomain support
-- Requirements: 5.1, 5.2, 5.3

-- Add nullable custom_subdomain column
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS custom_subdomain TEXT;

-- Unique index on non-null values for fast subdomain lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_clubs_custom_subdomain
  ON public.clubs(custom_subdomain)
  WHERE custom_subdomain IS NOT NULL;

-- Check constraint: lowercase alphanumeric + hyphens, no leading/trailing hyphens, max 63 chars
ALTER TABLE public.clubs
  ADD CONSTRAINT chk_custom_subdomain_format
  CHECK (
    custom_subdomain IS NULL
    OR (
      custom_subdomain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
      AND length(custom_subdomain) <= 63
    )
  );
