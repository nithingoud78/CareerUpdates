-- Blog System (idempotent re-run of full migration)
-- Drops and recreates from scratch if needed

CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  cover_image text,
  category text,
  tags text[] DEFAULT '{}',
  author text DEFAULT 'Career Updates',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE OR REPLACE FUNCTION update_blogs_modtime()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION update_blogs_modtime();

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published blogs" ON blogs;
CREATE POLICY "Public can read published blogs"
  ON blogs FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins have full access to blogs" ON blogs;
CREATE POLICY "Admins have full access to blogs"
  ON blogs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS blogs_slug_idx ON blogs (slug);
CREATE INDEX IF NOT EXISTS blogs_status_idx ON blogs (status);
CREATE INDEX IF NOT EXISTS blogs_featured_idx ON blogs (featured);
CREATE INDEX IF NOT EXISTS blogs_published_at_idx ON blogs (published_at DESC);

-- ─── 3 Sample Blog Posts ──────────────────────────────────────────────────────

INSERT INTO blogs (title, slug, excerpt, content, category, tags, author, status, featured, seo_title, seo_description, published_at)
VALUES
(
  'Resume Tips for Freshers: Stand Out From the Crowd',
  'resume-tips-for-freshers',
  'Your resume is the first thing recruiters see. Here''s how freshers can craft a resume that gets noticed — even with no experience.',
  E'# Resume Tips for Freshers: Stand Out From the Crowd\n\nGetting your first job is exciting — but before you land the interview, you need to get past the resume screening. As a fresher, you don''t have years of experience, but that doesn''t mean your resume can''t stand out.\n\n## 1. Lead With a Strong Summary\n\nYour summary sits at the top of your resume and is the first thing a recruiter reads. Keep it to 2–3 sentences and make it specific.\n\n**Weak:** "Hardworking computer science graduate looking for opportunities."\n\n**Strong:** "Computer Science graduate from VIT with hands-on project experience in React and Node.js. Built 3 full-stack applications. Looking for a full-time role in product engineering."\n\n## 2. Lead With Projects, Not Internships\n\nIf you don''t have internships, your projects are your portfolio. List the top 2–3 projects with:\n\n- Project name and short description\n- Tech stack used\n- Link to GitHub or live demo\n- Impact: "Served 200+ users", "Reduced load time by 40%"\n\n## 3. Tailor for Every Job\n\nNever send the same resume to every company. Read the job description carefully and match your skills and experience to their requirements.\n\n## 4. Keep It to One Page\n\nAs a fresher, one page is mandatory. Recruiters spend less than 10 seconds on the first pass. Make every word count.\n\n## 5. Use Action Verbs\n\nStart every bullet point with a strong action verb:\n- Built, Designed, Implemented, Reduced, Increased, Optimised\n\n## 6. Proofread Ruthlessly\n\nA single typo can get your resume rejected. Use Grammarly, print it out, and read it aloud.\n\n## 7. Use a Clean Template\n\nAvoid fancy templates with graphics, colours, and tables. They break ATS (Applicant Tracking Systems). Use a clean, single-column layout.\n\n## Quick Resume Checklist\n\n- [ ] Contact info: Email, LinkedIn, GitHub, Phone\n- [ ] Education: Degree, College, Year, CGPA\n- [ ] Skills: Relevant technical and soft skills\n- [ ] Projects: 2-3 with clear descriptions\n- [ ] Certifications (if any)\n- [ ] One page only\n\nGood luck — your dream job starts with a great resume!',
  'Career Tips',
  ARRAY['Resume', 'Freshers', 'Job Search', 'Career'],
  'Career Updates Team',
  'published',
  true,
  'Resume Tips for Freshers 2025 | Career Updates',
  'Learn how to write a resume that gets noticed as a fresher — even with no experience. Step-by-step tips from Career Updates.',
  now() - interval '3 days'
),
(
  'LinkedIn Profile Optimization: Get Noticed by Recruiters',
  'linkedin-profile-optimization-guide',
  'A fully optimized LinkedIn profile can bring job opportunities to you. Here''s the exact playbook to make your profile recruiter-ready.',
  E'# LinkedIn Profile Optimization: Get Noticed by Recruiters\n\nDid you know that over 87% of recruiters use LinkedIn to find candidates? A poorly optimized profile means you''re invisible. Here''s how to fix that.\n\n## Step 1: Profile Photo\n\nUse a professional headshot — clear face, plain background, good lighting. No selfies, no group photos.\n\n## Step 2: Your Headline\n\nYour headline appears under your name everywhere on LinkedIn. It''s prime real estate.\n\n**Default (bad):** "Student at XYZ University"\n\n**Optimized:** "Full Stack Developer | React + Node.js | Open to Work"\n\nInclude your key skill, tech stack, and a call to action.\n\n## Step 3: The About Section\n\nWrite in first person. Tell your story in 3–5 paragraphs:\n\n1. Who you are\n2. What you do / your skills\n3. What you''ve built or achieved\n4. What you''re looking for\n\nEnd with your email or a note saying "Open to opportunities".\n\n## Step 4: Experience & Projects\n\nFor each role or project, use bullet points with measurable outcomes:\n- "Reduced API response time by 60% using Redis caching"\n- "Built a React dashboard used by 500+ users"\n\n## Step 5: Skills — Choose Wisely\n\nAdd 5–10 highly relevant skills. LinkedIn ranks profiles with endorsed skills higher in search.\n\nAsk colleagues, classmates, or managers to endorse your top skills.\n\n## Step 6: Open to Work\n\nEnable the "Open to Work" feature. You can make it visible to recruiters only (not your current employer).\n\nSet your job preferences accurately — role type, location, remote options.\n\n## Step 7: Engage Daily\n\nPost one update per week. Comment on posts in your industry. The LinkedIn algorithm rewards active users.\n\n## Final Checklist\n\n- [ ] Professional photo\n- [ ] Keyword-rich headline\n- [ ] Strong About section\n- [ ] 3+ experience/project entries\n- [ ] Skills with endorsements\n- [ ] Open to Work enabled\n- [ ] Custom URL (linkedin.com/in/yourname)\n\nStart today. An optimized profile works for you 24/7.',
  'Career Tips',
  ARRAY['LinkedIn', 'Personal Branding', 'Job Search', 'Recruiters'],
  'Career Updates Team',
  'published',
  false,
  'LinkedIn Profile Optimization Guide 2025 | Career Updates',
  'Optimize your LinkedIn profile to attract recruiters. Step-by-step guide from Career Updates.',
  now() - interval '6 days'
),
(
  'Top Interview Mistakes (And How to Avoid Them)',
  'top-interview-mistakes-to-avoid',
  'Even well-prepared candidates fail interviews by making avoidable mistakes. Here are the most common ones and exactly how to fix them.',
  E'# Top Interview Mistakes (And How to Avoid Them)\n\nYou prepared for weeks. You know your algorithms. You researched the company. And yet — rejection.\n\nSometimes it''s not about what you know. It''s about what you did wrong in the room. Here are the most common interview mistakes and how to avoid every single one of them.\n\n## Mistake 1: Not Researching the Company\n\nWhen an interviewer asks "What do you know about us?" and you draw a blank — it''s over.\n\n**Fix:** Spend 30 minutes researching:\n- What does the company do?\n- What products do they build?\n- Recent news or funding?\n- Their tech stack (check their engineering blog)\n\n## Mistake 2: Talking Too Much (or Too Little)\n\nRambling answers waste time and lose the interviewer. One-word answers show disinterest.\n\n**Fix:** Use the STAR method — Situation, Task, Action, Result. Keep answers to 90 seconds max for behavioral questions.\n\n## Mistake 3: Not Asking Questions\n\n"Do you have any questions for me?" — "No, I''m good."\n\nThis is a red flag. It signals you''re not genuinely interested.\n\n**Fix:** Prepare 3–5 questions:\n- "What does a typical day look like for this role?"\n- "What are the biggest challenges the team is facing?"\n- "What does success look like in the first 90 days?"\n\n## Mistake 4: Talking Negatively About Past Employers\n\n"My last manager was terrible..." — Never say this.\n\n**Fix:** Stay positive. "I learned a lot at my previous role and I''m looking for a new challenge with more ownership."\n\n## Mistake 5: Not Knowing Your Own Resume\n\nIf you listed a technology on your resume, you will be asked about it.\n\n**Fix:** Review every line of your resume the night before. Be able to explain every project and technology in depth.\n\n## Mistake 6: Poor Body Language\n\nNo eye contact, slouching, arms crossed — all send negative signals.\n\n**Fix:** Sit upright, maintain natural eye contact, nod when the interviewer speaks. Smile when appropriate.\n\n## Mistake 7: Not Following Up\n\nMost candidates don''t send a thank-you note after the interview.\n\n**Fix:** Send a short email within 24 hours:\n"Thank you for taking the time to speak with me today. I really enjoyed learning about [specific topic from interview]. I''m very excited about this opportunity."\n\n## Summary\n\n| Mistake | Fix |\n|---------|-----|\n| No company research | Spend 30 min on their website/blog |\n| Rambling answers | Use STAR method |\n| No questions asked | Prepare 3-5 thoughtful questions |\n| Negativity about past role | Stay positive and forward-looking |\n| Forgetting your resume | Review it the night before |\n| Poor body language | Sit upright, maintain eye contact |\n| No follow-up | Send a thank-you email within 24h |\n\nAvoiding these mistakes alone can dramatically improve your success rate. Good luck!',
  'Interview Prep',
  ARRAY['Interviews', 'Career Tips', 'Job Search', 'Soft Skills'],
  'Career Updates Team',
  'published',
  false,
  'Top Interview Mistakes to Avoid in 2025 | Career Updates',
  'Avoid these common interview mistakes that cost candidates the job. Practical tips from Career Updates.',
  now() - interval '10 days'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  author = EXCLUDED.author,
  status = EXCLUDED.status,
  featured = EXCLUDED.featured,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  published_at = EXCLUDED.published_at;

-- ─── Feedback Table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read')),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT (submit contact form)
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Only admins can read/update/delete
DROP POLICY IF EXISTS "Admins manage feedback" ON feedback;
CREATE POLICY "Admins manage feedback"
  ON feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback (status);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);
