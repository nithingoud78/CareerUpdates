const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const expansions = {
  "resume-tips-for-freshers": `
## Comprehensive Resume Deep Dive for Indian Freshers

When applying for roles in major Indian IT hubs (Bengaluru, Pune, Hyderabad), your resume is typically scanned for exactly 6 seconds by recruiters before moving to the next one. This means every pixel of your one-page document must earn its place. Let’s break down exactly how to structure each section for maximum impact.

### 1. The Contact Header: Keep it Professional
Do not include your full address, marital status, religion, or father’s name. This is outdated practice and consumes valuable space. Instead, your header should only contain:
* **Full Name** (Largest font on the page)
* **Professional Email Address** (e.g., \`firstname.lastname@gmail.com\`, not \`coolcoder99@yahoo.com\`)
* **Phone Number** (With country code if applying internationally, otherwise just the 10 digits)
* **LinkedIn Profile URL** (Ensure the URL is customized and clean)
* **GitHub / Portfolio URL** (Crucial for engineering and design roles)

### 2. The Professional Summary vs. Objective Statement
Many freshers in India still use generic objective statements copied from the internet ("Seeking a challenging role in a reputed organization to utilize my skills..."). **Do not do this.** 

Instead, write a 3-line **Professional Summary** that highlights your actual technical stack, academic achievements, and core projects.
* *Example (Bad):* Looking for a software engineering job to grow my career.
* *Example (Good):* Computer Science fresher skilled in React and Node.js. Developed a full-stack e-commerce prototype handling 500+ mock transactions. Eager to contribute to scalable web architecture at a fast-paced product company.

### 3. Education Section (Reverse Chronological)
List your most recent degree first.
* **Degree Name:** B.Tech in Computer Science / B.Sc in IT
* **Institution Name:** XYZ College of Engineering, University Name
* **Graduation Year:** 2026
* **CGPA/Percentage:** Only include this if it is above 7.5 or 75%. If your college has strict grading, mention your class rank if it's impressive.

### 4. The Projects Section: Your Golden Ticket
As a fresher, you lack professional work experience. Your "Projects" section must fill this void. Never just list the project name. Use the **STAR Method** (Situation, Task, Action, Result) in bullet points:
* **What you built:** E.g., "Smart Traffic Management System"
* **Technologies used:** Python, OpenCV, TensorFlow
* **What you specifically did:** "Developed a computer vision module to detect vehicle density in real-time."
* **The outcome/impact:** "Achieved 92% detection accuracy and deployed the prototype on a Raspberry Pi."

### Actionable Checklist Before Submission
- [ ] Is it strictly one page? (Unless you have 5+ major published research papers)
- [ ] Did you export it as a PDF? (Never send a .doc or .docx file)
- [ ] Is the font readable? (Arial, Calibri, or Roboto at 10-12pt)
- [ ] Did you run it through Grammarly to catch typos?
- [ ] Is the filename professional? (e.g., \`Rahul_Sharma_Resume_SDE.pdf\`)
`,
  "top-10-interview-mistakes-to-avoid": `
## Deep Dive: Why These Mistakes Cost You the Job

Let's explore the psychology behind interview mistakes and why recruiters in Indian corporate environments specifically flag them as dealbreakers.

### Mistake 1: Memorizing Answers (The "Rote Learning" Trap)
In the Indian education system, rote memorization is common. However, in an interview for a modern tech or business role, reciting an answer you memorized from an online portal is instantly recognizable. When a recruiter hears a robotic, perfectly scripted answer to "Tell me about yourself," they immediately assume you lack organic communication skills.
* **The Fix:** Outline bullet points in your head, not full sentences. Speak conversationally.

### Mistake 2: Badmouthing Your College or Previous Internship
It's tempting to explain a low GPA by blaming the university professors, or complaining about a previous toxic internship. This is a massive red flag. It shows an inability to take ownership and suggests you might complain about the new company as well.
* **The Fix:** Frame negative experiences positively. Instead of "My professors were terrible," say, "Our curriculum was highly theoretical, so I took the initiative to learn practical web development through online bootcamps."

### Mistake 3: Failing the "Do You Have Any Questions?" Test
At the end of every interview, the panel will ask if you have questions. Saying "No, sir" implies you are desperate for any job and haven't seriously considered what working at *their* specific company means.
* **The Fix:** Always have 2-3 prepared questions. 
  * "Can you tell me about the tech stack the team is currently migrating towards?"
  * "What does a typical day look like for a junior analyst in this division?"

### Mistake 4: Faking Skills on the Resume
In technical interviews, if you put "Machine Learning" on your resume because you watched one YouTube video, the interviewer *will* drill down into it. Failing to explain a concept you claimed to know destroys your credibility for the entire interview.
* **The Fix:** Only list skills you can confidently discuss for at least 5 minutes. Use proficiency levels (e.g., "Proficient in Java," "Familiar with Python").

### Actionable Pre-Interview Checklist
- [ ] Research the company's recent news, product launches, or funding rounds.
- [ ] Prepare 3 "STAR" method stories from your college projects that demonstrate leadership, problem-solving, and teamwork.
- [ ] Test your webcam, microphone, and internet connection 30 minutes prior.
- [ ] Dress appropriately (Business formal for traditional companies, smart casual for modern startups).
- [ ] Have a glass of water nearby.
`,
  "how-to-find-first-job-fresher-india": `
## Advanced Strategies for the Indian Job Market

Finding your first job in India requires moving beyond just blindly clicking "Easy Apply" on massive job portals. With thousands of graduates competing for the same entry-level roles, you need a systematic, multi-channel approach.

### 1. Leverage the Hidden Job Market
Did you know that up to 70% of open positions are never formally advertised on job boards? They are filled internally, through employee referrals, or direct networking.
* **Informational Interviews:** Reach out to alumni from your college who are working in companies you admire. Don't ask for a job immediately. Ask for a 15-minute virtual coffee chat to understand their role and how they cracked the interview.
* **Employee Referrals:** Companies incentivize their employees to refer good candidates (often paying them a bonus). If you build a genuine connection with a software engineer at a target company, they are often happy to refer you, as it benefits both of you.

### 2. Targeting Startups vs. MNCs
As a fresher, you have a critical choice between joining a massive Multinational Corporation (MNC) like TCS, Infosys, or Wipro, versus joining a growing startup in hubs like Bangalore, Gurgaon, or Pune.

#### The MNC Route
* **Pros:** Job security, structured training programs (like Infosys Mysore campus), brand name on your resume, predictable work hours.
* **Cons:** Slower career growth, rigid hierarchies, legacy technologies, limited scope of work.
* **How to apply:** Focus on campus placements, mass off-campus recruitment drives (like TCS NQT), and standardized aptitude tests (eAmcat, CoCubes).

#### The Startup Route
* **Pros:** Exponential learning curve, exposure to modern tech stacks (React, Go, AWS), high autonomy, faster promotions.
* **Cons:** Less job security, chaotic processes, potentially longer working hours.
* **How to apply:** AngelList (Wellfound), direct DM to founders on Twitter/LinkedIn, participating in hackathons, and contributing to open-source projects.

### 3. The Power of "Proof of Work"
In modern hiring, your degree matters less than what you can actually build. "Proof of Work" is tangible evidence of your skills.
* **For Developers:** A live, deployed web application with the GitHub repository linked, showing clean code and regular commits.
* **For Marketers:** A detailed teardown of a brand's marketing strategy published on LinkedIn or Medium.
* **For Designers:** A Behance/Dribbble portfolio with 3 comprehensive case studies explaining your design decisions.

### 4. Attending Career Fairs and Hackathons
In-person networking is returning. Attend industry events, tech meetups, and hackathons (e.g., Smart India Hackathon). Winning or even just participating in a hackathon gives you direct access to technical recruiters who are actively hiring the best talent in the room.

### Actionable Checklist for Job Seekers
- [ ] Optimize your LinkedIn profile (Headline, About section, Skills).
- [ ] Create a "Proof of Work" portfolio (GitHub, Behance, or a personal website).
- [ ] Set up daily job alerts on Career Updates, LinkedIn, and specialized portals.
- [ ] Prepare for aptitude and logical reasoning tests (crucial for Indian MNCs).
- [ ] Practice coding problems on LeetCode/GeeksforGeeks if targeting software roles.
`,
  "how-to-avoid-job-scams-india": `
## Deep Dive: The Mechanics of Indian Job Scams

Job scams in India have evolved into highly sophisticated, multi-crore organized operations. Scammers prey on the desperation of fresh graduates, using psychological manipulation and fake authority to extract money. Let's break down exactly how these scams operate and how you can protect yourself.

### The "Security Deposit" Scam (The Most Common)
* **How it works:** You receive an offer letter that looks incredibly professional—often featuring the stolen logo of a major MNC like Tata, Reliance, or a global tech firm. The letter states you have been selected but requires a "refundable security deposit" (usually Rs. 2,000 to Rs. 15,000) for laptop allocation, background verification, or training materials.
* **The Reality:** No legitimate company in the world asks a candidate to pay money to get a job. The moment you transfer the funds via UPI or bank transfer, the "HR manager" blocks your number.
* **The Rule:** If you have to pay money to get the job, it is a scam. 100% of the time.

### The Fake Consultancy Scam
* **How it works:** A "placement agency" guarantees you a job within 30 days. They ask for a registration fee or demand that you pay for their mandatory "skill certification program" before they arrange interviews.
* **The Reality:** Legitimate headhunters and recruitment agencies are paid by the *employer* (usually a percentage of your starting salary). They never charge the candidate.
* **The Rule:** Never pay a consultancy fee upfront.

### The Phishing Interview
* **How it works:** You are invited to a "technical interview" which is actually a thinly veiled attempt to harvest your personal data. They ask for your Aadhar card, PAN card, and bank account details "for HR processing" before an offer is even discussed.
* **The Reality:** While companies do need this information eventually, it is only collected *after* you have formally accepted a verifiable job offer and are undergoing official onboarding.
* **The Rule:** Never share sensitive government ID or financial details during the interview stage.

### How to Verify a Job Offer
1. **Check the Email Domain:** An offer from Amazon will come from \`@amazon.com\`. It will never come from \`amazon.hr.recruitment@gmail.com\` or \`careers-amazon.in\`. Scammers buy cheap domains that look similar to the real one.
2. **Cross-Check on LinkedIn:** Look up the name of the HR person who contacted you. Do they actually work at the company? Reach out to them on LinkedIn to verify the email.
3. **Verify the Address:** If an address is provided, check it on Google Maps. Does a corporate office exist there, or is it a residential building?
4. **Call the Official Number:** Find the official company switchboard number on their verified website (not the number provided in the email) and ask to be connected to the HR department to verify the offer.

### What to Do If You've Been Scammed
1. **Do not pay any more money.** Scammers will often invent new reasons ("tax fees", "processing fees") to extract more funds once you've paid the first time.
2. **Report immediately:** File a complaint on the official Indian Government Cyber Crime Portal at **cybercrime.gov.in** or call the national helpline at **1930**.
3. **Contact your bank:** If you made a UPI or bank transfer, contact your bank's fraud department immediately to attempt a chargeback or freeze the transaction.
`,
  "private-job-vs-government-job-india": `
## Deep Dive: Making the Crucial Career Choice

The debate between pursuing a private sector corporate job versus a government job (Sarkari Naukri) is a defining moment for millions of Indian graduates. This decision shapes not just your career trajectory, but your entire lifestyle, financial planning, and social standing. Let's analyze the nuances beyond the surface-level stereotypes.

### 1. Job Security and Stability
* **Government Sector:** This is the primary draw. Once you clear your probation period in a government role (e.g., Bank PO, SSC CGL, UPSC), firing is exceedingly rare unless there is severe misconduct or criminal activity. You are shielded from economic recessions, mass layoffs, and company bankruptcies.
* **Private Sector:** Highly volatile. Job security is tied entirely to your performance, the company's profitability, and macroeconomic conditions. Tech layoffs during economic downturns are common. You must continuously upskill to remain employable.

### 2. Salary and Financial Growth
* **Government Sector:** Starting salaries are decent and structured strictly according to Pay Commissions (e.g., 7th CPC). You receive standard allowances (Dearness Allowance, HRA, Medical). However, salary growth is linear and predictable. You will not see massive 50% salary hikes in a single year.
* **Private Sector:** Starting salaries can vary wildly (from Rs. 3 LPA in mass IT recruitment to Rs. 20+ LPA in top product companies). However, the growth potential is uncapped. With strategic job switching every 2-3 years, a private sector professional can easily multiply their salary significantly within a decade.

### 3. Work-Life Balance and Perks
* **Government Sector:** Generally offers defined working hours, fixed holidays, and generous leave policies (earned leaves, casual leaves, maternity/paternity leave). The perks are substantial: government quarters (housing), medical coverage (CGHS), and post-retirement pension benefits (NPS).
* **Private Sector:** Work-life balance depends heavily on company culture. Startups and high-growth MNCs often demand long, irregular hours and weekend availability. Perks might include health insurance, stock options (ESOPs), free meals, and gym memberships, but rarely housing or lifelong pensions.

### 4. Career Progression and Promotions
* **Government Sector:** Promotions are largely seniority-based. You must wait a specific number of years to be eligible for the next rank, though some departmental exams can accelerate this slightly. Merit and hard work often take a backseat to tenure.
* **Private Sector:** Strictly merit-based. If you deliver exceptional results, you can be promoted to a managerial position rapidly, bypassing older colleagues. Performance directly correlates with career advancement and financial reward.

### 5. The Preparation Toll (The Hidden Cost)
* **Government Sector:** The barrier to entry is brutal. Exams like UPSC, SBI PO, or SSC have acceptance rates of less than 1%. Millions of aspirants spend 2-4 years of their prime youth isolated in coaching centers, facing immense psychological pressure. If you fail after 3 years, you enter the private market with a significant gap on your resume.
* **Private Sector:** The barrier to entry is skill-based. Preparation involves building projects, doing internships, and practicing interview skills. If rejected by one company, you can apply to another the next day. There is no multi-year waiting period for the next "exam cycle."

### How to Decide?
Choose the **Government Sector** if you prioritize stability, predictable hours, societal prestige in smaller towns, and structured benefits over rapid wealth accumulation.

Choose the **Private Sector** if you are highly ambitious, adaptable to change, willing to constantly learn new skills, desire rapid financial growth, and thrive in competitive, merit-driven environments.
`
};

async function expandBlogs() {
  console.log("Starting blog expansion...");
  for (const [slug, extraContent] of Object.entries(expansions)) {
    const { data: blog, error: fetchError } = await supabase
      .from('blogs')
      .select('id, content')
      .eq('slug', slug)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching " + slug + ":", fetchError);
      continue;
    }

    if (!blog) {
      console.log("Blog " + slug + " not found, skipping.");
      continue;
    }

    // Idempotency check: don't append if already expanded
    if (blog.content && blog.content.includes('Deep Dive')) {
      console.log("Blog " + slug + " already expanded. Skipping.");
      continue;
    }

    const newContent = blog.content + "\n\n" + extraContent;
    
    const { error: updateError } = await supabase
      .from('blogs')
      .update({ content: newContent })
      .eq('id', blog.id);

    if (updateError) {
      console.error("Failed to update " + slug + ":", updateError);
    } else {
      console.log("Successfully expanded " + slug + " (New length: " + newContent.length + " chars)");
    }
  }
  console.log("Blog expansion complete.");
}

expandBlogs();
