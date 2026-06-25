-- Add details column to crawl_logs
ALTER TABLE public.crawl_logs ADD COLUMN IF NOT EXISTS details JSONB;
