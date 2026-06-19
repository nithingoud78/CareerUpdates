
-- ============= ROLES =============
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= JOBS =============
CREATE TYPE public.job_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  location TEXT,
  experience TEXT,
  salary TEXT,
  employment_type TEXT,
  qualification TEXT,
  apply_url TEXT NOT NULL,
  description TEXT,
  ai_summary TEXT,
  meta_description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  category TEXT,
  status job_status NOT NULL DEFAULT 'draft',
  posted_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_date DATE,
  views INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX jobs_status_posted_idx ON public.jobs(status, posted_date DESC);
CREATE INDEX jobs_category_idx ON public.jobs(category);
CREATE INDEX jobs_search_idx ON public.jobs USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(company,'') || ' ' || coalesce(location,'') || ' ' || coalesce(description,'')));

GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published jobs" ON public.jobs
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins view all jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert jobs" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update jobs" ON public.jobs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete jobs" ON public.jobs
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= AI SETTINGS =============
CREATE TABLE public.ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'lovable',
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  base_url TEXT,
  api_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai_settings" ON public.ai_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ai_settings_updated_at BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Default Lovable AI Gateway entry
INSERT INTO public.ai_settings (provider, model, base_url, is_active)
VALUES ('lovable', 'google/gemini-3-flash-preview', 'https://ai.gateway.lovable.dev/v1', true);

-- ============= SEED JOBS =============
INSERT INTO public.jobs (slug, title, company, company_logo, location, experience, salary, employment_type, qualification, apply_url, description, ai_summary, meta_description, tags, category, status, last_date) VALUES
('infosys-off-campus-drive-2026', 'Infosys Off Campus Drive 2026', 'Infosys', 'https://logo.clearbit.com/infosys.com', 'Bengaluru, India', 'Freshers, 0-2 years', '₹3.5 LPA - ₹5.5 LPA', 'Full-time', 'BE, B.Tech, ME, M.Tech, MCA, MSc', 'https://career.infosys.com', 'Infosys is hiring fresh graduates for software engineering roles across multiple locations in India. Join one of the largest IT services companies and work on cloud, AI and digital transformation projects.', 'Infosys is recruiting 2026 batch graduates for entry-level engineering positions. The selection involves an online aptitude test, technical interview and HR round. Candidates with BE/B.Tech/MCA degrees and 65%+ academic record are eligible.', 'Apply for Infosys Off Campus Drive 2026. Fresher hiring for software engineer roles across India. Salary ₹3.5-5.5 LPA.', ARRAY['Off Campus','Fresher','IT','Software'], 'IT', 'published', '2026-10-31'),
('tcs-nqt-2026', 'TCS NQT 2026 - National Qualifier Test', 'TCS', 'https://logo.clearbit.com/tcs.com', 'Pan India', '0-1 year', '₹3.36 LPA - ₹7 LPA', 'Full-time', 'BE, B.Tech, MCA, MSc', 'https://nextstep.tcs.com', 'TCS National Qualifier Test 2026 is open for 2024-2026 batch graduates. Crack the NQT to get into one of India''s most prestigious IT companies.', 'TCS NQT is a single test that unlocks job opportunities across TCS and partner companies. The test covers numerical ability, verbal reasoning, coding and personality traits.', 'TCS NQT 2026 registration open. Apply for software engineer roles at TCS via the National Qualifier Test.', ARRAY['TCS','NQT','Fresher','IT'], 'IT', 'published', '2026-09-15'),
('google-software-engineer-intern', 'Software Engineer Intern', 'Google', 'https://logo.clearbit.com/google.com', 'Bengaluru / Hyderabad', '0-1 year', 'Competitive Stipend', 'Internship', 'B.Tech CS, M.Tech, MS', 'https://careers.google.com', 'Google is hiring software engineering interns to work on cutting-edge products used by billions. Interns work alongside full-time engineers on real, impactful projects.', 'Google''s Software Engineering Internship offers a chance to work on production systems at scale. The process includes coding rounds and technical interviews focused on data structures, algorithms and system design.', 'Apply for Google Software Engineer Internship 2026 in India. Competitive stipend, real-world projects.', ARRAY['Google','Internship','SDE'], 'Internship', 'published', '2026-08-30'),
('wipro-elite-nltt-2026', 'Wipro Elite NLTH 2026', 'Wipro', 'https://logo.clearbit.com/wipro.com', 'Pan India', 'Freshers', '₹3.5 LPA', 'Full-time', 'BE, B.Tech, M.Tech, MCA', 'https://careers.wipro.com', 'Wipro National Talent Hunt 2026 hires fresh engineering graduates as Project Engineers across India.', 'The Wipro Elite NLTH selection has three stages: an online assessment with aptitude and coding, a written communication test and a business/technical interview.', 'Wipro Elite NLTH 2026 - apply for Project Engineer role. Fresher hiring across India.', ARRAY['Wipro','Fresher','IT'], 'IT', 'published', '2026-09-20'),
('accenture-associate-software-engineer', 'Associate Software Engineer', 'Accenture', 'https://logo.clearbit.com/accenture.com', 'Bengaluru, Mumbai, Pune', '0-2 years', '₹4.5 LPA', 'Full-time', 'BE, B.Tech, MCA', 'https://www.accenture.com/in-en/careers', 'Accenture is hiring Associate Software Engineers for application development, cloud and data engineering practices.', 'Accenture''s recruitment process includes a cognitive and technical assessment followed by a communication round and a final technical/HR interview.', 'Accenture hiring Associate Software Engineer 2026 - apply now for ₹4.5 LPA package.', ARRAY['Accenture','Fresher','Consulting','IT'], 'IT', 'published', '2026-11-10'),
('amazon-sde-intern-2026', 'SDE Intern - Amazon', 'Amazon', 'https://logo.clearbit.com/amazon.com', 'Bengaluru, Hyderabad', 'Pre-final year', '₹80,000/month', 'Internship', 'B.Tech, M.Tech, MS', 'https://amazon.jobs', 'Amazon hires Software Development Engineering interns to build features for AWS, Alexa, Prime Video and other products.', 'Amazon''s SDE Intern hiring evaluates problem-solving via online coding rounds and behavioral interviews aligned to Amazon''s Leadership Principles.', 'Amazon SDE Internship 2026 - pre-final year students apply for SDE intern role in Bengaluru/Hyderabad.', ARRAY['Amazon','Internship','SDE'], 'Internship', 'published', '2026-07-30'),
('isro-scientist-engineer-2026', 'ISRO Scientist/Engineer 2026', 'ISRO', 'https://logo.clearbit.com/isro.gov.in', 'Bengaluru, Thiruvananthapuram', 'Freshers', '₹56,100 - ₹1,77,500', 'Government', 'BE/B.Tech in EC, CS, ME', 'https://www.isro.gov.in/Careers.html', 'ISRO is recruiting Scientist/Engineer ''SC'' for various centres across India. A prestigious opportunity to contribute to India''s space program.', 'ISRO Scientist/Engineer selection involves a written test followed by an interview. Candidates need a minimum 65% in BE/B.Tech.', 'ISRO Scientist Engineer 2026 recruitment - apply online for government engineering jobs.', ARRAY['ISRO','Government','Engineering'], 'Government', 'published', '2026-08-20'),
('flipkart-grid-2026', 'Flipkart GRiD 6.0 Challenge', 'Flipkart', 'https://logo.clearbit.com/flipkart.com', 'Bengaluru', 'Students', 'Internship + PPO', 'Internship', 'B.Tech, M.Tech', 'https://unstop.com/flipkart-grid', 'Flipkart GRiD is a campus engagement program offering hackathons across software, robotics and design tracks with PPO opportunities.', 'Top performers in Flipkart GRiD get internships and Pre-Placement Offers. Tracks include Software Development, Information Security, Data Science and Robotics.', 'Flipkart GRiD 6.0 - apply for the campus challenge with internship and PPO opportunities.', ARRAY['Flipkart','Internship','Hackathon'], 'Internship', 'published', '2026-07-15');
