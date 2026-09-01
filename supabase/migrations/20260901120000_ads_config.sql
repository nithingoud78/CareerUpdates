-- ============================================================
-- Global Ads Configuration columns on site_settings
-- ============================================================
-- Adds three columns to the existing site_settings table to
-- support the admin Ads ON/OFF global control with automatic
-- 1-hour re-enable.
--
-- ads_enabled         : authoritative global flag (true = ads on)
-- ads_disabled_at     : timestamp when admin last turned ads off
-- ads_auto_enable_at  : ads_disabled_at + 1 hour; when
--                       now() >= this value, the server fn
--                       atomically re-enables ads on the next read.
-- ============================================================

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS ads_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ads_disabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ads_auto_enable_at TIMESTAMPTZ;

-- Ensure the existing row has the correct default value.
-- (safe no-op if already true)
UPDATE site_settings SET ads_enabled = true WHERE ads_enabled IS NULL;
