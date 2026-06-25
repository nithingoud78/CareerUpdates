-- ============================================
-- Phase 1 Production Migration (Safe Version)
-- ============================================

-- 1. Add subcategory column if it doesn't exist
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 2. Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_email TEXT,
  telegram_url TEXT,
  whatsapp_url TEXT,
  instagram_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Ensure only one row exists
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_single_row_idx
ON public.site_settings ((1));

-- 4. Insert default row only if table is empty
INSERT INTO public.site_settings (
  contact_email,
  telegram_url,
  whatsapp_url,
  instagram_url
)
SELECT
  'hello@careerupdates.app',
  'https://t.me/',
  'https://whatsapp.com/channel/',
  'https://instagram.com/'
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_settings
);

-- 5. Permissions
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

-- 6. Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 7. Policies
DROP POLICY IF EXISTS "Public can view site_settings" ON public.site_settings;
CREATE POLICY "Public can view site_settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage site_settings" ON public.site_settings;
CREATE POLICY "Admins manage site_settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Trigger
DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;

CREATE TRIGGER site_settings_updated_at
BEFORE UPDATE
ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();