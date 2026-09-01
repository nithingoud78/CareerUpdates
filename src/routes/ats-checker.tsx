import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickySocial } from "@/components/sticky-social";
import { AtsResultDisplay } from "@/components/career-tools/ats-result-display";
import { analyzeResume, extractResumeText } from "@/lib/ats-checker.functions";
import type { AtsResult } from "@/lib/ats-checker.functions";

const SITE_URL = "https://careerupdates.co.in";
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_TEXT_LENGTH = 15000;

export const Route = createFileRoute("/ats-checker")({
  head: () => ({
    meta: [
      { title: "ATS Resume Checker — Check Your Resume Against a Job | Career Updates" },
      { name: "description", content: "Check how well your resume matches a job description. Get keyword analysis, missing skills, formatting feedback, and actionable improvement suggestions. Free ATS compatibility check." },
      { property: "og:title", content: "ATS Resume Checker | Career Updates" },
      { property: "og:description", content: "Check your resume against any job description. Get a detailed ATS compatibility report with matched keywords, missing skills, and improvement suggestions." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/ats-checker` },
      { property: "og:image", content: `${SITE_URL}/careerupdates-share-2026.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ATS Resume Checker | Career Updates" },
      { name: "twitter:description", content: "Check your resume against any job description. Get keyword analysis, missing skills, and improvement suggestions." },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/ats-checker` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "ATS Checker", item: `${SITE_URL}/ats-checker` },
          ],
        }),
      },
    ],
  }),
  component: AtsChecker,
});

// Progress steps for loading state
const PROGRESS_STEPS = [
  "Preparing resume content…",
  "Analysing job description…",
  "Comparing skills and keywords…",
  "Checking formatting signals…",
  "Generating recommendations…",
];

function useProgressSimulator(active: boolean) {
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setStep(0);
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      if (i < PROGRESS_STEPS.length) setStep(i);
      else if (timerRef.current) clearInterval(timerRef.current);
    }, 2200);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep(0);
  };

  return { step, start, stop };
}

function AtsChecker() {
  const analyze = useServerFn(analyzeResume);
  const extract = useServerFn(extractResumeText);
  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const progress = useProgressSimulator(false);
  const sessionId = useRef(Math.random().toString(36).slice(2));

  const mutation = useMutation({
    mutationFn: () =>
      analyze({
        data: {
          resume_text: resumeText,
          job_description: jobDesc,
          session_id: sessionId.current,
        },
      }),
    onMutate: () => {
      progress.start();
      setResult(null);
    },
    onSuccess: (data: AtsResult) => {
      progress.stop();
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    },
    onError: () => {
      progress.stop();
    },
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedExtensions = [".txt", ".pdf", ".docx"];
    const isAllowed = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) ||
      ["text/plain", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type);
      
    if (!isAllowed) {
      setFileError("Unsupported file format. Please upload a PDF, DOCX, or TXT file.");
      e.target.value = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File is too large (max 2MB).`);
      e.target.value = "";
      return;
    }

    setIsExtracting(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await extract({ data: formData as any });
      
      if (res && res.text) {
        setResumeText(res.text);
      }
    } catch (err: any) {
      setFileError(err.message || "Could not extract text. Please try pasting it directly.");
      setFileName(null);
      setResumeText("");
    } finally {
      setIsExtracting(false);
      e.target.value = "";
    }
  }

  function clearFile() {
    setFileName(null);
    setResumeText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const canSubmit =
    resumeText.trim().length >= 50 &&
    jobDesc.trim().length >= 30 &&
    !mutation.isPending;

  const charCount = (text: string) =>
    text.length > MAX_TEXT_LENGTH
      ? `${text.length}/${MAX_TEXT_LENGTH} — too long`
      : `${text.length}/${MAX_TEXT_LENGTH}`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent_70%)]" />
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-12 text-center sm:px-6">
          <p className="mb-3 inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            Career Tools
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            ATS <span className="text-brand">Resume Checker</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Paste your resume and a job description to get a detailed ATS compatibility report — keyword analysis, missing skills, formatting feedback, and actionable improvement suggestions.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Privacy notice */}
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p>
            <strong>Privacy:</strong> Your resume text is sent to an AI analysis service to generate the compatibility report and is not permanently stored. Do not paste information you do not want processed by a third-party AI provider. No resume content is logged or shared publicly.
          </p>
        </div>

        {/* Input form */}
        <div className="space-y-6">
          {/* Resume input */}
          <section className="glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Your Resume</h2>
              <div className="flex items-center gap-2">
                {fileName ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                    <FileText className="h-3 w-3" />
                    {fileName}
                    <button
                      onClick={clearFile}
                      aria-label="Remove uploaded file"
                      className="ml-1 rounded-full hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="resume-file-upload"
                      aria-label="Upload resume"
                      disabled={isExtracting}
                    />
                    <label
                      htmlFor="resume-file-upload"
                      className={`flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors ${
                        isExtracting ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"
                      }`}
                    >
                      {isExtracting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      {isExtracting ? "Extracting..." : "Upload Resume (PDF, DOCX, TXT)"}
                    </label>
                  </>
                )}
              </div>
            </div>

            {fileError && (
              <p className="flex items-center gap-1.5 rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {fileError}
              </p>
            )}

            <textarea
              id="resume-text-input"
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (fileName) setFileName(null);
              }}
              placeholder="Paste your resume text here... Include your contact info, experience, education, skills, and any other sections."
              className="h-56 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
              aria-label="Resume text"
              maxLength={MAX_TEXT_LENGTH + 1000}
            />
            <p className={`text-right text-[11px] ${resumeText.length > MAX_TEXT_LENGTH ? "text-red-500" : "text-muted-foreground"}`}>
              {charCount(resumeText)}
            </p>
          </section>

          {/* Job description input */}
          <section className="glass rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-foreground">Job Description</h2>
            <textarea
              id="job-description-input"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the full job description here... Include role title, responsibilities, required skills, and qualifications."
              className="h-48 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
              aria-label="Job description"
              maxLength={MAX_TEXT_LENGTH + 1000}
            />
            <p className={`text-right text-[11px] ${jobDesc.length > MAX_TEXT_LENGTH ? "text-red-500" : "text-muted-foreground"}`}>
              {charCount(jobDesc)}
            </p>
          </section>

          {/* Submit */}
          <div className="flex flex-col items-center gap-3">
            {mutation.error && (
              <p
                role="alert"
                className="flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {(mutation.error as Error).message}
              </p>
            )}

            <button
              id="check-resume-btn"
              onClick={() => mutation.mutate()}
              disabled={!canSubmit}
              aria-busy={mutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-64"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Check My Resume
                </>
              )}
            </button>

            {!canSubmit && !mutation.isPending && (
              <p className="text-xs text-muted-foreground">
                {resumeText.trim().length < 50 && "Resume is too short. "}
                {jobDesc.trim().length < 30 && "Job description is too short."}
              </p>
            )}
          </div>

          {/* Loading progress */}
          {mutation.isPending && (
            <div aria-live="polite" className="glass rounded-2xl p-6 text-center space-y-4">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
              <p className="font-medium text-foreground">
                {PROGRESS_STEPS[progress.step]}
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-1000"
                  style={{ width: `${Math.min(90, ((progress.step + 1) / PROGRESS_STEPS.length) * 90)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This usually takes 15–30 seconds depending on resume length.
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div ref={resultRef} className="mt-10" aria-live="polite">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Results</h2>
              <button
                onClick={() => {
                  setResult(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                New Analysis
              </button>
            </div>
            <AtsResultDisplay result={result} />
          </div>
        )}

        {/* Promo — resume templates */}
        {!mutation.isPending && (
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <Link
              to="/resume-templates"
              className="glass flex items-center gap-4 rounded-2xl p-5 transition-all hover:shadow-sm hover:shadow-brand/10"
            >
              <FileText className="h-8 w-8 shrink-0 text-brand" />
              <div>
                <p className="font-semibold">Resume Templates</p>
                <p className="text-sm text-muted-foreground">ATS-friendly templates starting at ₹29</p>
              </div>
            </Link>
            <Link
              to="/resume-bundles"
              className="glass flex items-center gap-4 rounded-2xl p-5 transition-all hover:shadow-sm hover:shadow-brand/10"
            >
              <FileText className="h-8 w-8 shrink-0 text-brand" />
              <div>
                <p className="font-semibold">Resume Bundles</p>
                <p className="text-sm text-muted-foreground">Resume + cover letter + outreach templates</p>
              </div>
            </Link>
          </div>
        )}

        {/* How it works */}
        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-bold">How the ATS Checker Works</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { step: "1", title: "Paste your resume", desc: "Copy and paste your resume text. You can also upload a .txt file." },
              { step: "2", title: "Add the job description", desc: "Paste the full job description from the company's job posting." },
              { step: "3", title: "Get your report", desc: "Receive a detailed compatibility analysis with keyword gaps and suggestions." },
            ].map((item) => (
              <div key={item.step} className="glass rounded-2xl p-4 space-y-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {item.step}
                </span>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="mt-8 flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            This tool provides an ATS compatibility estimate based on keyword and content analysis. It does not
            guarantee job interview selection, ATS pass rates, or hiring outcomes. Results are informational only.
            Career Updates does not store or share resume content submitted through this tool.
          </p>
        </div>
      </main>

      <SiteFooter />
      <StickySocial />
    </div>
  );
}
