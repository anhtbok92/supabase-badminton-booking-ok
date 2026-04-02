-- Add slug column to clubs for SEO-friendly URLs
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_clubs_slug ON public.clubs(slug) WHERE slug IS NOT NULL;

-- Function to generate slug from Vietnamese text
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT) RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := lower(trim(input_text));
  -- Vietnamese character replacements
  result := translate(result,
    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyyd'
  );
  -- Replace non-alphanumeric with hyphens
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  -- Remove leading/trailing hyphens
  result := trim(both '-' from result);
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-generate slugs for existing clubs
UPDATE public.clubs SET slug = generate_slug(name) WHERE slug IS NULL;

-- Handle duplicate slugs by appending a number
DO $$
DECLARE
  rec RECORD;
  counter INTEGER;
  new_slug TEXT;
BEGIN
  FOR rec IN
    SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
    FROM public.clubs
    WHERE slug IN (SELECT slug FROM public.clubs GROUP BY slug HAVING COUNT(*) > 1)
  LOOP
    IF rec.rn > 1 THEN
      counter := rec.rn;
      new_slug := rec.slug || '-' || counter;
      WHILE EXISTS (SELECT 1 FROM public.clubs WHERE slug = new_slug AND id != rec.id) LOOP
        counter := counter + 1;
        new_slug := rec.slug || '-' || counter;
      END LOOP;
      UPDATE public.clubs SET slug = new_slug WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;

-- Trigger to auto-generate slug on insert/update if not provided
CREATE OR REPLACE FUNCTION auto_generate_club_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.name);
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.clubs WHERE slug = final_slug AND id != NEW.id) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_club_slug
  BEFORE INSERT OR UPDATE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_club_slug();
