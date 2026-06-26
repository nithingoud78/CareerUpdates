-- Migration: Add company_logo_storage_url column to jobs table
-- This stores the permanent Supabase Storage URL after logo has been cached.
-- The existing company_logo column is kept as-is for backwards compatibility.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS company_logo_storage_url TEXT DEFAULT NULL;

COMMENT ON COLUMN jobs.company_logo_storage_url IS
  'Permanent Supabase Storage public URL for the company logo. '
  'Takes priority over company_logo (which may point to a third-party CDN).';

-- Create the logo storage bucket (public, so logos are directly accessible)
-- Note: bucket creation is done via Supabase dashboard or supabase-js admin client.
-- This comment documents the required bucket configuration:
--   Bucket name: company-logos
--   Public: true
--   File size limit: 512000 (500 KB)
--   Allowed MIME types: image/png, image/jpeg, image/webp, image/svg+xml, image/x-icon
