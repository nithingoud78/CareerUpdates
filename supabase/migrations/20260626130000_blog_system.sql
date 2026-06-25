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

-- ─── 6 Sample Blog Posts ──────────────────────────────────────────────────────

INSERT INTO blogs (title, slug, excerpt, content, cover_image, category, tags, author, status, featured, seo_title, seo_description, published_at)
VALUES
(
  'Resume Tips for Freshers: Stand Out From the Crowd',
  'resume-tips-for-freshers',
  'Your resume is the first thing recruiters see. Here''s how freshers can craft a resume that gets noticed — even with no experience.',
  E'# Resume Tips for Freshers: Stand Out From the Crowd\n\nGetting your first job is exciting — but before you land the interview, you need to get past the resume screening. As a fresher, you don''t have years of experience, but that doesn''t mean your resume can''t stand out. This comprehensive guide covers everything you need to craft a winning resume.\n\n## 1. Lead With a Strong Summary\n\nYour summary sits at the top of your resume and is the first thing a recruiter reads. Keep it to 2–3 sentences and make it specific.\n\n**Weak:** "Hardworking computer science graduate looking for opportunities."\n\n**Strong:** "Computer Science graduate from VIT with hands-on project experience in React and Node.js. Built 3 full-stack applications. Looking for a full-time role in product engineering."\n\n## 2. Lead With Projects, Not Internships\n\nIf you don''t have internships, your projects are your portfolio. List the top 2–3 projects with:\n\n- Project name and short description\n- Tech stack used\n- Link to GitHub or live demo\n- Impact: "Served 200+ users", "Reduced load time by 40%"\n\n## 3. Tailor for Every Job\n\nNever send the same resume to every company. Read the job description carefully and match your skills and experience to their requirements.\n\n## 4. Keep It to One Page\n\nAs a fresher, one page is mandatory. Recruiters spend less than 10 seconds on the first pass. Make every word count.\n\n## 5. Use Action Verbs\n\nStart every bullet point with a strong action verb:\n- Built, Designed, Implemented, Reduced, Increased, Optimised\n\n## 6. Proofread Ruthlessly\n\nA single typo can get your resume rejected. Use Grammarly, print it out, and read it aloud.\n\n## 7. Use a Clean Template\n\nAvoid fancy templates with graphics, colours, and tables. They break ATS (Applicant Tracking Systems). Use a clean, single-column layout.\n\n## Quick Resume Checklist\n\n- [ ] Contact info: Email, LinkedIn, GitHub, Phone\n- [ ] Education: Degree, College, Year, CGPA\n- [ ] Skills: Relevant technical and soft skills\n- [ ] Projects: 2-3 with clear descriptions\n- [ ] Certifications (if any)\n- [ ] One page only\n\nGood luck — your dream job starts with a great resume!',
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
  'Career Tips',
  ARRAY['Resume', 'Freshers', 'Job Search', 'Career'],
  'Career Updates Team',
  'published',
  true,
  'Resume Tips for Freshers 2026 | Career Updates',
  'Learn how to write a resume that gets noticed as a fresher — even with no experience. Step-by-step tips from Career Updates.',
  now() - interval '2 days'
),
(
  'Top 10 Interview Mistakes (And How to Avoid Them)',
  'top-10-interview-mistakes-to-avoid',
  'Even well-prepared candidates fail interviews by making avoidable mistakes. Here are the most common ones and exactly how to fix them.',
  E'# Top 10 Interview Mistakes (And How to Avoid Them)\n\nYou prepared for weeks. You know your algorithms. You researched the company. And yet — rejection.\n\nSometimes it''s not about what you know. It''s about what you did wrong in the room. Here are the top 10 interview mistakes and how to avoid every single one of them.\n\n## Mistake 1: Not Researching the Company\n\nWhen an interviewer asks "What do you know about us?" and you draw a blank — it''s over.\n\n**Fix:** Spend 30 minutes researching:\n- What does the company do?\n- What products do they build?\n- Recent news or funding?\n- Their tech stack (check their engineering blog)\n\n## Mistake 2: Talking Too Much (or Too Little)\n\nRambling answers waste time and lose the interviewer. One-word answers show disinterest.\n\n**Fix:** Use the STAR method — Situation, Task, Action, Result. Keep answers to 90 seconds max for behavioral questions.\n\n## Mistake 3: Not Asking Questions\n\n"Do you have any questions for me?" — "No, I''m good."\n\nThis is a red flag. It signals you''re not genuinely interested.\n\n**Fix:** Prepare 3–5 questions:\n- "What does a typical day look like for this role?"\n- "What are the biggest challenges the team is facing?"\n- "What does success look like in the first 90 days?"\n\n## Mistake 4: Talking Negatively About Past Employers\n\n"My last manager was terrible..." — Never say this.\n\n**Fix:** Stay positive. "I learned a lot at my previous role and I''m looking for a new challenge with more ownership."\n\n## Mistake 5: Not Knowing Your Own Resume\n\nIf you listed a technology on your resume, you will be asked about it.\n\n**Fix:** Review every line of your resume the night before. Be able to explain every project and technology in depth.\n\n## Mistake 6: Poor Body Language\n\nNo eye contact, slouching, arms crossed — all send negative signals.\n\n**Fix:** Sit upright, maintain natural eye contact, nod when the interviewer speaks. Smile when appropriate.\n\n## Mistake 7: Failing to Prepare for Behavioral Questions\n\nTechnical skills aren''t enough if you fail culture fit.\n\n**Fix:** Have 3-4 versatile stories ready that demonstrate leadership, problem-solving, and conflict resolution.\n\n## Mistake 8: Lying About Your Skills\n\nClaiming expertise in something you only used once will backfire during technical rounds.\n\n**Fix:** Be honest. "I''m familiar with the basics, but I haven''t used it in production yet."\n\n## Mistake 9: Interrupting the Interviewer\n\nTalking over the person assessing you shows poor listening skills and disrespect.\n\n**Fix:** Let them finish speaking entirely before you begin your response.\n\n## Mistake 10: Not Following Up\n\nMost candidates don''t send a thank-you note after the interview.\n\n**Fix:** Send a short email within 24 hours:\n"Thank you for taking the time to speak with me today. I really enjoyed learning about [specific topic from interview]. I''m very excited about this opportunity."\n\nAvoiding these mistakes alone can dramatically improve your success rate. Good luck!',
  'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&q=80',
  'Interview Prep',
  ARRAY['Interviews', 'Career Tips', 'Job Search', 'Soft Skills'],
  'Career Updates Team',
  'published',
  false,
  'Top 10 Interview Mistakes to Avoid in 2026 | Career Updates',
  'Avoid these common interview mistakes that cost candidates the job. Practical tips from Career Updates.',
  now() - interval '5 days'
),
(
  'LinkedIn Profile Optimization: Get Noticed by Recruiters',
  'linkedin-profile-optimization-guide',
  'A fully optimized LinkedIn profile can bring job opportunities to you. Here''s the exact playbook to make your profile recruiter-ready.',
  E'# LinkedIn Profile Optimization: Get Noticed by Recruiters\n\nDid you know that over 87% of recruiters use LinkedIn to find candidates? A poorly optimized profile means you''re invisible. Here''s how to fix that.\n\n## Step 1: Profile Photo\n\nUse a professional headshot — clear face, plain background, good lighting. No selfies, no group photos.\n\n## Step 2: Your Headline\n\nYour headline appears under your name everywhere on LinkedIn. It''s prime real estate.\n\n**Default (bad):** "Student at XYZ University"\n\n**Optimized:** "Full Stack Developer | React + Node.js | Open to Work"\n\nInclude your key skill, tech stack, and a call to action.\n\n## Step 3: The About Section\n\nWrite in first person. Tell your story in 3–5 paragraphs:\n\n1. Who you are\n2. What you do / your skills\n3. What you''ve built or achieved\n4. What you''re looking for\n\nEnd with your email or a note saying "Open to opportunities".\n\n## Step 4: Experience & Projects\n\nFor each role or project, use bullet points with measurable outcomes:\n- "Reduced API response time by 60% using Redis caching"\n- "Built a React dashboard used by 500+ users"\n\n## Step 5: Skills — Choose Wisely\n\nAdd 5–10 highly relevant skills. LinkedIn ranks profiles with endorsed skills higher in search.\n\nAsk colleagues, classmates, or managers to endorse your top skills.\n\n## Step 6: Open to Work\n\nEnable the "Open to Work" feature. You can make it visible to recruiters only (not your current employer).\n\nSet your job preferences accurately — role type, location, remote options.\n\n## Step 7: Engage Daily\n\nPost one update per week. Comment on posts in your industry. The LinkedIn algorithm rewards active users.\n\n## Final Checklist\n\n- [ ] Professional photo\n- [ ] Keyword-rich headline\n- [ ] Strong About section\n- [ ] 3+ experience/project entries\n- [ ] Skills with endorsements\n- [ ] Open to Work enabled\n- [ ] Custom URL (linkedin.com/in/yourname)\n\nStart today. An optimized profile works for you 24/7.',
  'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=800&q=80',
  'Career Tips',
  ARRAY['LinkedIn', 'Personal Branding', 'Job Search', 'Recruiters'],
  'Career Updates Team',
  'published',
  false,
  'LinkedIn Profile Optimization Guide 2026 | Career Updates',
  'Optimize your LinkedIn profile to attract recruiters. Step-by-step guide from Career Updates.',
  now() - interval '8 days'
),
(
  'Difference Between Internship and Full-Time Jobs',
  'internship-vs-full-time-jobs',
  'Confused about what to expect from an internship versus a full-time role? Let''s break down the key differences in responsibilities, pay, and expectations.',
  E'# Difference Between Internship and Full-Time Jobs\n\nAs you transition from university to the professional world, you''ll encounter two primary types of employment: Internships and Full-Time Jobs. While both offer valuable experience, they differ significantly in their structure, expectations, and long-term impact on your career.\n\n## 1. Scope of Work and Responsibilities\n\n**Internships:** Internships are designed as learning experiences. You will typically be assigned a mentor and given scoped, specific projects. The expectation is that you are there to learn, ask questions, and understand how the industry works. The stakes are generally lower.\n\n**Full-Time Jobs:** When you are a full-time employee, you are expected to deliver consistent value. While learning never stops, the primary focus shifts to productivity, meeting deadlines, and contributing to the company''s bottom line. You will have a defined set of ongoing responsibilities.\n\n## 2. Duration and Commitment\n\n**Internships:** Most internships are temporary. They last anywhere from 1 to 6 months (often aligning with summer breaks or academic semesters). Once the term is over, the internship ends unless an extension or full-time offer is extended (a "PPO" or Pre-Placement Offer).\n\n**Full-Time Jobs:** Full-time roles are permanent (or open-ended) contracts. You are expected to stay with the company for a longer period, usually years, and your employment continues indefinitely until you resign or are terminated.\n\n## 3. Compensation and Benefits\n\n**Internships:** Interns may be paid a stipend (often an hourly wage or a fixed monthly amount), or in some cases, they may be unpaid (though this is becoming less common in tech). Interns rarely receive benefits like health insurance, paid time off, or retirement contributions.\n\n**Full-Time Jobs:** Full-time employees receive a regular salary, along with a comprehensive benefits package. This typically includes health insurance, paid vacation days, sick leave, bonuses, and retirement plans (like PF in India or 401(k) in the US).\n\n## 4. Expectations and Evaluation\n\n**Internships:** You are evaluated heavily on your attitude, willingness to learn, and how well you collaborate with the team. The end goal for many companies is to evaluate if you would make a good full-time hire after graduation.\n\n**Full-Time Jobs:** You are evaluated on your performance metrics, KPIs (Key Performance Indicators), and overall output. Annual performance reviews determine your salary hikes and promotions.\n\n## Summary Comparison\n\n| Feature | Internship | Full-Time Job |\n|---------|------------|---------------|\n| **Goal** | Learning & Evaluation | Execution & Value Delivery |\n| **Duration** | Short-term (1-6 months) | Long-term / Indefinite |\n| **Pay** | Stipend / Hourly / Unpaid | Salary + Full Benefits |\n| **Mentorship** | High, dedicated mentor | Standard manager relationship |\n\nBoth are crucial steps in a successful career. Use internships to explore different roles and companies before committing to a full-time career path.',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  'Career Advice',
  ARRAY['Internships', 'Career Tips', 'Freshers', 'Full-Time'],
  'Career Updates Team',
  'published',
  false,
  'Internship vs Full-Time Job: What You Need to Know | Career Updates',
  'Understand the key differences between internships and full-time jobs, from pay and benefits to expectations and daily responsibilities.',
  now() - interval '12 days'
),
(
  'How to Crack Technical Interviews in 2026',
  'how-to-crack-technical-interviews',
  'Technical interviews are notoriously difficult. This comprehensive guide covers Data Structures, System Design, and Behavioral rounds to help you succeed.',
  E'# How to Crack Technical Interviews in 2026\n\nThe landscape of technical interviews has evolved. It''s no longer just about reversing a linked list on a whiteboard; companies want to see how you solve real-world problems, how you write production-level code, and how you communicate your thought process. Here is your ultimate guide to cracking technical interviews in 2026.\n\n## 1. Master Data Structures and Algorithms (DSA)\n\nDSA remains the foundation of technical screening for most major tech companies (FAANG and beyond). \n\n**What to focus on:**\n- **Arrays & Strings:** Two-pointer techniques, sliding window, and string manipulation.\n- **Hashmaps & Sets:** Crucial for optimizing time complexity from O(N^2) to O(N).\n- **Trees & Graphs:** BFS, DFS, and topological sort.\n- **Dynamic Programming:** Focus on the classic problems (knapsack, coin change, longest common subsequence).\n\n*Actionable Tip:* Don''t just memorize solutions. Practice identifying *patterns* on platforms like LeetCode or HackerRank. Aim to solve 150-200 medium-level problems with a deep understanding of the optimal approaches.\n\n## 2. Think Out Loud\n\nIn a technical interview, a silent candidate is a failing candidate. The interviewer isn''t just looking for the right code; they are evaluating your problem-solving process.\n\n**The Process:**\n1. **Clarify the question:** Ask about edge cases, inputs, and constraints. Never start coding immediately.\n2. **Propose a brute force solution:** Acknowledge that it''s not optimal, but establish a baseline.\n3. **Optimize:** Discuss time and space complexities. Suggest better data structures.\n4. **Write the code:** Keep it clean and modular.\n5. **Dry run:** Walk through your code with a sample input to catch bugs before the interviewer does.\n\n## 3. System Design (For Experienced Roles)\n\nIf you have more than 2 years of experience, expect a System Design round. This is where you design scalable architectures for systems like Twitter, Netflix, or Uber.\n\n**Key Concepts to Know:**\n- Load Balancing and Reverse Proxies\n- Caching (Redis, Memcached)\n- Database Sharding and Replication\n- Microservices vs. Monoliths\n- Message Queues (Kafka, RabbitMQ)\n\n*Actionable Tip:* Use the "Requirements -> Estimation -> High-Level Design -> Deep Dive" framework to structure your answer.\n\n## 4. The Behavioral Round (Culture Fit)\n\nNever underestimate the behavioral round. Companies use this to ensure you aren''t toxic and that you align with their core values (e.g., Amazon''s Leadership Principles).\n\n**How to prepare:**\nUse the **STAR** method:\n- **S**ituation: Set the scene.\n- **T**ask: What was your responsibility?\n- **A**ction: What specific steps did you take?\n- **R**esult: What was the measurable outcome?\n\nPrepare stories for conflicts, failures, leadership, and tight deadlines.\n\n## 5. Mock Interviews\n\nPracticing by yourself is vastly different from writing code while someone is watching you. Do mock interviews with peers, mentors, or platforms like Pramp to simulate the pressure.\n\nTechnical interviews are a numbers game combined with preparation. Stay consistent, review your weak areas, and the offers will follow.',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
  'Interview Prep',
  ARRAY['Interviews', 'Coding', 'DSA', 'System Design'],
  'Career Updates Team',
  'published',
  true,
  'How to Crack Technical Interviews in 2026 | Career Updates',
  'The ultimate guide to passing software engineering technical interviews. Tips on DSA, System Design, and Behavioral rounds.',
  now() - interval '15 days'
),
(
  'ATS Resume Guide 2026: Beat the Bots',
  'ats-resume-guide-2026',
  'Applicant Tracking Systems (ATS) filter out 70% of resumes before a human ever sees them. Here is how to ensure your resume passes the bot test.',
  E'# ATS Resume Guide 2026: Beat the Bots\n\nYou applied to 100 jobs, got 0 interviews, and received 100 automated rejection emails. Sound familiar? \n\nThe problem likely isn''t your experience—it''s your resume format. Welcome to the world of Applicant Tracking Systems (ATS).\n\n## What is an ATS?\n\nAn Applicant Tracking System is software used by employers to collect, scan, sort, and rank the job applications they receive. When you upload your resume, the ATS parses the text to identify your skills, work history, and education. If your resume is formatted poorly, the parser fails, and you are automatically rejected.\n\n## 1. Ditch the Fancy Formats\n\nCanva resumes with two columns, progress bars for skills, and heavy graphics look beautiful to humans, but they are a nightmare for ATS bots.\n\n**The Rule:** Keep it simple.\n- Use a standard, single-column layout.\n- Avoid tables, text boxes, and columns.\n- Do not use logos or icons.\n- Do not put important information in the header or footer (ATS often ignores these areas).\n\n## 2. Use Standard Section Headings\n\nATS bots look for standard keywords to organize your information. Don''t get creative with your section titles.\n\n**Use these:**\n- Work Experience\n- Education\n- Skills\n- Projects\n\n**Avoid these:**\n- "My Journey"\n- "Where I''ve Been"\n- "What I Can Do"\n\n## 3. Match the Keywords\n\nAn ATS ranks your resume based on how well it matches the job description. \n\nIf the job requires "Search Engine Optimization" but your resume only says "SEO", the ATS might miss it. If the job description asks for "Customer Service", don''t write "Client Relations".\n\n*Pro Tip:* Use a tool like Jobscan to compare your resume against the job description and ensure you hit the right keyword density.\n\n## 4. Choose the Right File Format\n\nUnless the job application explicitly requests a PDF, **.docx is the most ATS-friendly format**. \n\nHowever, modern ATS systems handle PDFs very well. If you submit a PDF, ensure it was exported from a text document (like Word or Google Docs) and not saved as an image. You should be able to highlight and copy the text.\n\n## 5. Write Out Dates Clearly\n\nATS parsers are rigid about dates. Use a standard format like "MM/YYYY" or "Month YYYY".\n\n**Example:**\n*Software Engineer | Google | June 2022 – Present*\n\n## Conclusion\n\nBeating the ATS isn''t about hacking the system; it''s about making your data incredibly easy to read for a machine. A clean, text-based, keyword-optimized resume is your golden ticket to the interview stage.',
  'https://images.unsplash.com/photo-1586282391129-76a6df230234?w=800&q=80',
  'Career Tips',
  ARRAY['Resume', 'ATS', 'Job Search', 'Career'],
  'Career Updates Team',
  'published',
  false,
  'ATS Resume Guide 2026: How to Beat the Bots | Career Updates',
  'Learn how to optimize your resume for Applicant Tracking Systems (ATS). Avoid common formatting mistakes and land more interviews.',
  now() - interval '20 days'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_image = EXCLUDED.cover_image,
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
