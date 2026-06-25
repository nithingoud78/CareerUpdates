-- Alter existing site_settings table to add missing columns
ALTER TABLE site_settings
  -- General
  ADD COLUMN IF NOT EXISTS site_name text NOT NULL DEFAULT 'Career Updates',
  ADD COLUMN IF NOT EXISTS site_tagline text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS favicon_url text,
  
  -- Contact (contact_email already exists)
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_address text,
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  
  -- Social Links (instagram_url, telegram_url, whatsapp_url already exist)
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS x_twitter_url text,
  
  -- SEO
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  
  -- Footer
  ADD COLUMN IF NOT EXISTS copyright_text text,
  ADD COLUMN IF NOT EXISTS footer_description text,
  ADD COLUMN IF NOT EXISTS quick_links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS privacy_policy_url text,
  ADD COLUMN IF NOT EXISTS terms_conditions_url text;

-- Enable RLS (if not already enabled)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policies (Drop first to avoid duplication errors)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON site_settings;
CREATE POLICY "Public profiles are viewable by everyone."
  ON site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can update site_settings" ON site_settings;
CREATE POLICY "Only admins can update site_settings"
  ON site_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Helper trigger for updated_at
CREATE OR REPLACE FUNCTION update_site_settings_modtime()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION update_site_settings_modtime();
