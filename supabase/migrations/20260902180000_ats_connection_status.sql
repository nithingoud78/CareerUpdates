-- ── Add Connection Status to ats_settings ───────────────────────

ALTER TABLE public.ats_settings
  ADD COLUMN IF NOT EXISTS connection_status text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_tested_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_success_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS last_tested_provider text,
  ADD COLUMN IF NOT EXISTS last_tested_model text;
