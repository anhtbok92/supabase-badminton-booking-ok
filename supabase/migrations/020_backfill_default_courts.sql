-- 020_backfill_default_courts.sql
-- Create 5 default courts for clubs that have no courts

INSERT INTO public.courts (club_id, name, "order")
SELECT c.id, 'Sân ' || n, n
FROM public.clubs c
CROSS JOIN generate_series(1, 5) AS n
WHERE c.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.courts ct WHERE ct.club_id = c.id
  );
