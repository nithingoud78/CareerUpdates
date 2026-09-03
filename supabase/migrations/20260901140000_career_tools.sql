-- ============================================================
-- CAREER TOOLS MIGRATION
-- Adds: career_tool_products, bundle_resources, ats_settings
-- ============================================================

-- ── Enums ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.career_product_type AS ENUM ('single_template', 'bundle');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.career_resource_type AS ENUM ('resume', 'cover_letter', 'referral_message', 'cold_email');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.career_product_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Table: career_tool_products ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.career_tool_products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text NOT NULL UNIQUE,
  title               text NOT NULL,
  short_description   text,
  description         text,
  product_type        public.career_product_type NOT NULL DEFAULT 'single_template',
  resource_type       public.career_resource_type NOT NULL DEFAULT 'resume',
  category            text,
  tags                text[] DEFAULT '{}',
  suitable_for        text[] DEFAULT '{}',
  features            text[] DEFAULT '{}',
  ats_friendly        boolean DEFAULT false,
  file_format         text,                    -- e.g. 'DOCX', 'PDF', 'DOCX,PDF'
  file_url            text,                    -- Supabase storage path
  preview_image_url   text,                    -- Supabase storage path or external URL
  original_price      numeric(10,2) NOT NULL DEFAULT 299,
  current_price       numeric(10,2) NOT NULL DEFAULT 29,
  status              public.career_product_status NOT NULL DEFAULT 'draft',
  pinned              boolean DEFAULT false,
  sort_order          integer DEFAULT 0,
  seo_title           text,
  seo_description     text,
  og_image            text,
  -- License / attribution for test/imported assets
  source_url          text,
  license             text,
  license_url         text,
  attribution_required boolean DEFAULT false,
  attribution_text    text,
  imported_at         timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_career_products_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_career_tool_products_updated_at ON public.career_tool_products;
CREATE TRIGGER trg_career_tool_products_updated_at
  BEFORE UPDATE ON public.career_tool_products
  FOR EACH ROW EXECUTE FUNCTION public.update_career_products_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_career_products_status ON public.career_tool_products (status);
CREATE INDEX IF NOT EXISTS idx_career_products_type ON public.career_tool_products (product_type);
CREATE INDEX IF NOT EXISTS idx_career_products_pinned ON public.career_tool_products (pinned);
CREATE INDEX IF NOT EXISTS idx_career_products_slug ON public.career_tool_products (slug);

-- ── Table: bundle_resources ───────────────────────────────────
-- Pivot table: which products belong to a bundle product
CREATE TABLE IF NOT EXISTS public.bundle_resources (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_product_id   uuid NOT NULL REFERENCES public.career_tool_products(id) ON DELETE CASCADE,
  resource_product_id uuid NOT NULL REFERENCES public.career_tool_products(id) ON DELETE CASCADE,
  sort_order          integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  UNIQUE (bundle_product_id, resource_product_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_resources_bundle ON public.bundle_resources (bundle_product_id);
CREATE INDEX IF NOT EXISTS idx_bundle_resources_resource ON public.bundle_resources (resource_product_id);

-- ── Table: ats_settings ───────────────────────────────────────
-- COMPLETELY SEPARATE from ai_settings (used for job extraction)
CREATE TABLE IF NOT EXISTS public.ats_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    text NOT NULL DEFAULT 'gemini',
  model       text NOT NULL DEFAULT 'gemini-1.5-flash',
  base_url    text,
  api_key     text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_ats_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ats_settings_updated_at ON public.ats_settings;
CREATE TRIGGER trg_ats_settings_updated_at
  BEFORE UPDATE ON public.ats_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_ats_settings_updated_at();

-- ── RLS: career_tool_products ─────────────────────────────────
ALTER TABLE public.career_tool_products ENABLE ROW LEVEL SECURITY;

-- Public: read only published products
CREATE POLICY "career_products_public_read"
  ON public.career_tool_products FOR SELECT
  USING (status = 'published');

-- Admin: full access
CREATE POLICY "career_products_admin_all"
  ON public.career_tool_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── RLS: bundle_resources ─────────────────────────────────────
ALTER TABLE public.bundle_resources ENABLE ROW LEVEL SECURITY;

-- Public: read bundle resources if bundle is published
CREATE POLICY "bundle_resources_public_read"
  ON public.bundle_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.career_tool_products
      WHERE id = bundle_product_id AND status = 'published'
    )
  );

-- Admin: full access
CREATE POLICY "bundle_resources_admin_all"
  ON public.bundle_resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── RLS: ats_settings ────────────────────────────────────────
-- Admin only — NO public read
ALTER TABLE public.ats_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ats_settings_admin_only"
  ON public.ats_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── Storage: career-tools bucket ─────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'career-tools',
  'career-tools',
  false,  -- NOT fully public; we use signed URLs for downloads
  10485760,  -- 10MB max file size
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated admins can upload
CREATE POLICY "career_tools_admin_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'career-tools'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "career_tools_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'career-tools'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "career_tools_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'career-tools'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Preview images: publicly readable (for product cards/pages)
CREATE POLICY "career_tools_preview_public_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'career-tools'
    AND (storage.foldername(name))[1] = 'previews'
  );

-- Authenticated users can read all files (for signed URL generation server-side)
-- Actual signed URL generation happens server-side with service role
CREATE POLICY "career_tools_authenticated_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'career-tools');

-- ── Seed: 2 test single templates ────────────────────────────
-- NOTE: These are original creations by Career Updates (not third-party).
-- No external license needed. Preview images will be uploaded separately.
-- file_url is NULL until admin uploads actual DOCX files.

INSERT INTO public.career_tool_products (
  slug, title, short_description, description,
  product_type, resource_type, category,
  suitable_for, features, ats_friendly,
  file_format, file_url, preview_image_url,
  original_price, current_price,
  status, pinned, sort_order,
  seo_title, seo_description,
  source_url, license, attribution_required, attribution_text
) VALUES
(
  'clean-professional-resume',
  'Clean Professional Resume',
  'A minimalist, ATS-optimised resume template perfect for experienced professionals.',
  'The Clean Professional Resume template is designed with ATS readability as the top priority. It features a single-column layout with clear section headings, consistent typography, and a professional structure that works equally well for software engineers, business professionals, and core engineering roles. The template is easy to edit in Microsoft Word or Google Docs and exports cleanly as PDF.',
  'single_template', 'resume', 'Professional',
  ARRAY['Experienced professionals','Software engineers','Business roles','Core engineers'],
  ARRAY['ATS-friendly single-column layout','Clean section hierarchy','Professional typography','Easy to edit in Word or Google Docs','Exports cleanly to PDF','No graphics or tables that confuse ATS'],
  true,
  'DOCX', NULL, NULL,
  299, 29,
  'published', true, 1,
  'Clean Professional Resume Template — ATS Friendly | Career Updates',
  'Download a clean, ATS-optimised professional resume template. Suitable for experienced professionals, software engineers, and business roles. ₹29 only.',
  NULL, 'Original Creation — Career Updates', false, NULL
),
(
  'modern-fresher-resume',
  'Modern Fresher Resume',
  'A fresh, clean resume template designed for students and new graduates entering the workforce.',
  'The Modern Fresher Resume template is purpose-built for students, recent graduates, and career-changers who want to make a strong first impression. It highlights education, internships, projects, and skills in a clear, recruiter-readable format. The clean layout avoids graphics-heavy designs that ATS systems struggle to parse, making it suitable for submitting to applicant tracking systems used by top companies.',
  'single_template', 'resume', 'Fresher',
  ARRAY['Freshers','Students','Recent graduates','Career changers','Designers','Internship seekers'],
  ARRAY['ATS-friendly layout','Education and projects emphasis','Skills section prominence','Internship-ready structure','Clean single-column design','Works with most ATS platforms'],
  true,
  'DOCX', NULL, NULL,
  299, 29,
  'published', false, 2,
  'Modern Fresher Resume Template — For Students & Graduates | Career Updates',
  'Download a modern, ATS-friendly resume template for freshers and recent graduates. Highlights projects, education, and skills clearly. ₹29 only.',
  NULL, 'Original Creation — Career Updates', false, NULL
)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: supporting resource products for bundles ────────────
INSERT INTO public.career_tool_products (
  slug, title, short_description, description,
  product_type, resource_type, category,
  suitable_for, features, ats_friendly,
  file_format, file_url, preview_image_url,
  original_price, current_price,
  status, pinned, sort_order,
  seo_title, seo_description,
  source_url, license, attribution_required, attribution_text
) VALUES
(
  'professional-cover-letter-template',
  'Professional Cover Letter Template',
  'A structured cover letter template that helps you write compelling, recruiter-ready cover letters.',
  'This cover letter template provides a proven structure for writing cover letters that complement your resume and catch a recruiter''s attention. It includes clearly labelled sections for your introduction, relevant experience highlights, why you want the role, and a professional closing. Available in DOCX format for easy editing.',
  'single_template', 'cover_letter', 'Professional',
  ARRAY['Experienced professionals','Freshers','Software engineers','Business roles'],
  ARRAY['Professional structure','Recruiter-tested format','Easy to personalise','Word-compatible DOCX format'],
  false,
  'DOCX', NULL, NULL,
  299, 29,
  'published', false, 3,
  'Professional Cover Letter Template | Career Updates',
  'Download a professional cover letter template. Structured, recruiter-ready format for all experience levels. ₹29 only.',
  NULL, 'Original Creation — Career Updates', false, NULL
),
(
  'referral-message-templates',
  'Employee Referral Message Templates',
  'Ready-to-use referral message templates for reaching out to employees at target companies.',
  'Getting referred by an existing employee dramatically increases your chances of getting an interview. This template pack includes message templates for LinkedIn outreach, email referral requests, and follow-up messages. Each template is professional, concise, and personalisation-ready — simply fill in the company name, role, and your relevant experience.',
  'single_template', 'referral_message', 'Networking',
  ARRAY['Freshers','Experienced professionals','Students','Job seekers'],
  ARRAY['LinkedIn message template','Email referral request template','Follow-up message template','Personalisation guide included'],
  false,
  'DOCX', NULL, NULL,
  299, 29,
  'published', false, 4,
  'Employee Referral Message Templates | Career Updates',
  'Download ready-to-use referral message templates for LinkedIn and email. Get more interviews through employee referrals. ₹29 only.',
  NULL, 'Original Creation — Career Updates', false, NULL
),
(
  'cold-email-templates',
  'Cold Emailing Templates for Job Search',
  'Professional cold email templates for reaching out to hiring managers and recruiters directly.',
  'Cold emailing hiring managers can open doors that job boards cannot. This template pack includes cold email templates for reaching out to hiring managers, HR contacts, and senior professionals in your target industry. Templates are concise, professional, and include guidance on subject lines, personalisation, and follow-up timing.',
  'single_template', 'cold_email', 'Outreach',
  ARRAY['Experienced professionals','Freshers','Career changers','Students'],
  ARRAY['Hiring manager outreach template','Recruiter cold email template','Subject line guide','Follow-up email template','Personalisation tips'],
  false,
  'DOCX', NULL, NULL,
  299, 29,
  'published', false, 5,
  'Cold Email Templates for Job Search | Career Updates',
  'Download professional cold email templates for job search outreach. Reach hiring managers and recruiters effectively. ₹29 only.',
  NULL, 'Original Creation — Career Updates', false, NULL
)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: 2 test bundles ─────────────────────────────────────
INSERT INTO public.career_tool_products (
  slug, title, short_description, description,
  product_type, resource_type, category,
  suitable_for, features, ats_friendly,
  file_format, file_url, preview_image_url,
  original_price, current_price,
  status, pinned, sort_order,
  seo_title, seo_description,
  source_url, license, attribution_required, attribution_text
) VALUES
(
  'complete-job-application-bundle',
  'Complete Job Application Bundle',
  'Everything you need to apply confidently — resume templates, cover letter templates, and referral message scripts.',
  'The Complete Job Application Bundle gives you a full toolkit to apply for jobs professionally. It includes ATS-friendly resume templates for both experienced professionals and freshers, a professional cover letter template, and referral message scripts for LinkedIn and email outreach. Whether you are applying to your first job or switching careers, this bundle covers every stage of the application process.',
  'bundle', 'resume', 'Bundle',
  ARRAY['Freshers','Experienced professionals','Students','Career changers','Software engineers'],
  ARRAY['2 ATS-friendly resume templates','1 cover letter template','1 referral message template pack','Professional formats across all documents','DOCX format for easy editing'],
  true,
  'DOCX', NULL, NULL,
  499, 79,
  'published', true, 1,
  'Complete Job Application Bundle — Resume, Cover Letter & Referral Templates | Career Updates',
  'Get the complete job application toolkit: ATS-friendly resume templates, cover letter template, and referral message scripts. Everything to apply confidently. ₹79 only.',
  NULL, 'Original Creation — Career Updates', false, NULL
),
(
  'campus-placement-bundle',
  'Campus Placement Bundle',
  'The ideal toolkit for students and freshers targeting campus placements and first jobs.',
  'The Campus Placement Bundle is built specifically for students and freshers preparing for campus placements, off-campus drives, and entry-level job applications. It includes a modern fresher resume template, referral message templates for reaching out to alumni and employees at your target companies, and cold email templates for approaching recruiters and hiring managers directly.',
  'bundle', 'resume', 'Bundle',
  ARRAY['Students','Freshers','Recent graduates','Internship seekers'],
  ARRAY['Modern fresher resume template','Alumni referral outreach scripts','Recruiter cold email templates','Campus placement ready format','Guidance on personalisation'],
  true,
  'DOCX', NULL, NULL,
  499, 79,
  'published', false, 2,
  'Campus Placement Bundle — Resume, Referral & Cold Email Templates | Career Updates',
  'The complete toolkit for campus placements: fresher resume template, referral message scripts, and cold email templates. Built for students and freshers. ₹79 only.',
  NULL, 'Original Creation — Career Updates', false, NULL
)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: bundle_resources links ─────────────────────────────
-- Complete Job Application Bundle → 2 resume templates + cover letter + referral
INSERT INTO public.bundle_resources (bundle_product_id, resource_product_id, sort_order)
SELECT b.id, r.id, rn.sort_order
FROM public.career_tool_products b
CROSS JOIN LATERAL (
  VALUES
    ('clean-professional-resume', 1),
    ('modern-fresher-resume', 2),
    ('professional-cover-letter-template', 3),
    ('referral-message-templates', 4)
) AS rn(slug, sort_order)
JOIN public.career_tool_products r ON r.slug = rn.slug
WHERE b.slug = 'complete-job-application-bundle'
ON CONFLICT (bundle_product_id, resource_product_id) DO NOTHING;

-- Campus Placement Bundle → fresher resume + referral + cold email
INSERT INTO public.bundle_resources (bundle_product_id, resource_product_id, sort_order)
SELECT b.id, r.id, rn.sort_order
FROM public.career_tool_products b
CROSS JOIN LATERAL (
  VALUES
    ('modern-fresher-resume', 1),
    ('referral-message-templates', 2),
    ('cold-email-templates', 3)
) AS rn(slug, sort_order)
JOIN public.career_tool_products r ON r.slug = rn.slug
WHERE b.slug = 'campus-placement-bundle'
ON CONFLICT (bundle_product_id, resource_product_id) DO NOTHING;
