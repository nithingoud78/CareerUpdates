-- ============================================
-- Automatic Daily Job Updater (Phase 1)
-- ============================================

-- 1. Create company_sources table
CREATE TABLE IF NOT EXISTS public.company_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  career_url TEXT NOT NULL,
  platform TEXT,
  enabled BOOLEAN DEFAULT true,
  crawl_frequency TEXT DEFAULT 'daily',
  last_checked TIMESTAMPTZ,
  last_success TIMESTAMPTZ,
  status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create crawl_logs table
CREATE TABLE IF NOT EXISTS public.crawl_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_source_id UUID NOT NULL REFERENCES public.company_sources(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  jobs_found INTEGER DEFAULT 0,
  jobs_added INTEGER DEFAULT 0,
  duplicates_skipped INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  status TEXT,
  error_message TEXT,
  duration_ms INTEGER
);

-- 3. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_sources TO authenticated;
GRANT ALL ON public.company_sources TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crawl_logs TO authenticated;
GRANT ALL ON public.crawl_logs TO service_role;

-- 4. Enable RLS
ALTER TABLE public.company_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_logs ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Admins manage company_sources"
ON public.company_sources
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage crawl_logs"
ON public.crawl_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Trigger for updated_at
CREATE TRIGGER company_sources_updated_at
BEFORE UPDATE
ON public.company_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.crawl_logs ADD COLUMN IF NOT EXISTS details JSONB;
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
    error_message TEXT,
    jobs_added INTEGER DEFAULT 0,
    jobs_failed INTEGER DEFAULT 0
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
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage scheduler_logs"
ON public.scheduler_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));