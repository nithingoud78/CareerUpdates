-- Phase 3: Automatic Scheduler

-- 1. Create scheduler_settings table
CREATE TABLE IF NOT EXISTS public.scheduler_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_running BOOLEAN DEFAULT false,
  last_run_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert singleton row if not exists
INSERT INTO public.scheduler_settings (id, is_running)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create scheduler_logs table
CREATE TABLE IF NOT EXISTS public.scheduler_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  companies_processed INTEGER DEFAULT 0,
  companies_skipped INTEGER DEFAULT 0,
  companies_failed INTEGER DEFAULT 0,
  duration_ms INTEGER,
  status TEXT DEFAULT 'running',
  error_message TEXT
);

-- 3. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduler_settings TO authenticated;
GRANT ALL ON public.scheduler_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduler_logs TO authenticated;
GRANT ALL ON public.scheduler_logs TO service_role;

-- 4. RLS
ALTER TABLE public.scheduler_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduler_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scheduler_settings"
ON public.scheduler_settings
FOR ALL
TO authenticated
USING ( (SELECT public.has_role(auth.uid(), 'admin')) );

CREATE POLICY "Admins manage scheduler_logs"
ON public.scheduler_logs
FOR ALL
TO authenticated
USING ( (SELECT public.has_role(auth.uid(), 'admin')) );
