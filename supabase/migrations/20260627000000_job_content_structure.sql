-- Migration: Add structured fields to jobs for AdSense content remediation

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'official',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified',
ADD COLUMN IF NOT EXISTS responsibilities TEXT,
ADD COLUMN IF NOT EXISTS required_qualifications TEXT,
ADD COLUMN IF NOT EXISTS preferred_qualifications TEXT,
ADD COLUMN IF NOT EXISTS work_model TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS about_company TEXT,
ADD COLUMN IF NOT EXISTS why_relevant TEXT,
ADD COLUMN IF NOT EXISTS application_guidance TEXT,
ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;

-- Ensure existing published jobs are marked as verified
UPDATE public.jobs
SET verification_status = 'verified',
    verified_at = now()
WHERE status = 'published' AND verified_at IS NULL;
