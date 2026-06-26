-- ============================================
-- Final Database Optimization & Cleanup
-- ============================================

-- 1. ADD TARGETED INDEXES TO JOBS
-- These support the deduplication checks and admin listing
CREATE INDEX IF NOT EXISTS jobs_apply_url_idx ON public.jobs (apply_url);
CREATE INDEX IF NOT EXISTS jobs_company_title_idx ON public.jobs (company, title);
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON public.jobs (created_at DESC);

-- These support search filtering
CREATE INDEX IF NOT EXISTS jobs_location_idx ON public.jobs (location);
CREATE INDEX IF NOT EXISTS jobs_employment_type_idx ON public.jobs (employment_type);
CREATE INDEX IF NOT EXISTS jobs_experience_idx ON public.jobs (experience);

-- Note: 
-- - 'slug' is already indexed via UNIQUE constraint
-- - 'category' is already indexed via jobs_category_idx
-- - '(status, posted_date)' is already indexed via jobs_status_posted_idx
-- - 'blogs' already has fully optimized indexes
-- - 'feedback' already has status and created_at indexes

-- 2. DROP OBSOLETE TABLES
-- The old automatic scheduler was removed from the codebase.
-- Its tables are no longer referenced anywhere in the app.
DROP TABLE IF EXISTS public.scheduler_logs CASCADE;
DROP TABLE IF EXISTS public.scheduler_settings CASCADE;
