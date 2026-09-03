import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
  Info,
  Mail,
  User,
  Phone,
  Lock,
  Download,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickySocial } from "@/components/sticky-social";
import { AtsResultDisplay } from "@/components/career-tools/ats-result-display";
import { analyzeResume, extractResumeText, getPublicAtsPricing } from "@/lib/ats-checker.functions";
import { createAtsCheckoutOrder, verifyRazorpayPayment } from "@/lib/payments.functions";
import { ScrollReveal } from "@/components/scroll-reveal";
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
  loader: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: ["ats-pricing"],
        queryFn: getPublicAtsPricing,
      });
    } catch (err) {
      console.error(err);
    }
  },
  component: AtsChecker,
});

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

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
  const { data: pricing } = useQuery({
    queryKey: ["ats-pricing"],
    queryFn: getPublicAtsPricing,
    initialData: { price: 5, original_price: 299, is_free: true }, // safe fallback
  });

  const analyze = useServerFn(analyzeResume);
  const extract = useServerFn(extractResumeText);
  const createOrder = useServerFn(createAtsCheckoutOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);

  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const [customer, setCustomer] = useState({
    fullName: "",
    email: "",
    countryCode: "+91",
    phone: "",
  });
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
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
      setHasDownloaded(false);
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

  const handleMainButtonClick = () => {
    setCheckoutError(null);
    if (!canSubmit) return;
    
    if (pricing.is_free) {
      mutation.mutate();
    } else {
      setShowCheckoutModal(true);
    }
  };

  async function handleCheckoutAndAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setCheckoutError(null);
    if (!canSubmit) return;

    if (!customer.email || !customer.email.includes("@")) {
      setCheckoutError("Please enter a valid email address.");
      return;
    }
    if (!customer.fullName.trim()) {
      setCheckoutError("Please enter your full name.");
      return;
    }
    if (!customer.countryCode) {
      setCheckoutError("Please select your country code.");
      return;
    }
    if (customer.countryCode === "+91" && customer.phone.length !== 10) {
      setCheckoutError("Phone number must be exactly 10 digits for India (+91).");
      return;
    }
    if (!customer.phone.trim() || customer.phone.length < 5) {
      setCheckoutError("Please enter a valid phone number.");
      return;
    }

    if (pricing.is_free) {
      setShowCheckoutModal(false);
      mutation.mutate();
      return;
    }

    try {
      progress.start();
      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");
      }

      const orderData = await createOrder({
        data: { customer },
      });

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Career Updates",
        description: orderData.productName,
        order_id: orderData.rzpOrderId,
        handler: async function (response: any) {
          try {
            await verifyPayment({
              data: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            // Payment successful, run analysis
            setShowCheckoutModal(false);
            mutation.mutate();
          } catch (err: any) {
            setCheckoutError(err.message || "Payment verification failed.");
            progress.stop();
          }
        },
        prefill: {
          name: customer.fullName,
          email: customer.email,
          contact: customer.phone,
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function () {
            progress.stop();
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setCheckoutError(response.error.description || "Payment failed.");
        progress.stop();
      });
      rzp.open();
    } catch (err: any) {
      setCheckoutError(err.message || "Something went wrong.");
      progress.stop();
    }
  }

  const charCount = (text: string) =>
    text.length > MAX_TEXT_LENGTH
      ? `${text.length}/${MAX_TEXT_LENGTH} — too long`
      : `${text.length}/${MAX_TEXT_LENGTH}`;

  const generatePdf = useCallback(async (isAuto = false) => {
    if (!reportRef.current) return;
    try {
      setIsGeneratingPdf(true);
      
      const { toPng } = await import("html-to-image");
      const jsPdfModule = await import("jspdf");
      const jsPDF = jsPdfModule.jsPDF || jsPdfModule.default;

      // Small delay to ensure styles are painted and images are loaded, especially if automatic
      await new Promise(resolve => setTimeout(resolve, isAuto ? 1000 : 300));

      const imgData = await toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: {
          margin: "0",
          padding: "20px",
        }
      });

      // Get natural dimensions from image to maintain aspect ratio
      const img = new Image();
      img.src = imgData;
      await new Promise(resolve => { img.onload = resolve; });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const margin = 20;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const printableWidth = pdfWidth - margin * 2;
      const imgHeight = (img.height * printableWidth) / img.width;
      
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, printableWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, printableWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }

      const candidateName = customer.fullName ? `-${customer.fullName.replace(/[^a-z0-9]/gi, '_')}` : "";
      pdf.save(`ATS-Resume-Checker-Report${candidateName}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      if (!isAuto) {
        alert("Failed to generate PDF. Please try again.");
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [customer.fullName]);

  // Auto-download removed as per requirement

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent_70%)]" />
        </div>
        <ScrollReveal className="mx-auto max-w-3xl px-4 pb-10 pt-12 text-center sm:px-6">
          <p className="mb-3 inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            Career Tools
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            ATS <span className="text-brand">Resume Checker</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Paste your resume and a job description to get a detailed ATS compatibility report — keyword analysis, missing skills, formatting feedback, and actionable improvement suggestions.
          </p>
        </ScrollReveal>
      </section>

      <main className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Privacy notice */}
        <ScrollReveal>
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <p>
              <strong>Privacy:</strong> Your resume text is sent to an AI analysis service to generate the compatibility report and is not permanently stored. Do not paste information you do not want processed by a third-party AI provider. No resume content is logged or shared publicly.
            </p>
          </div>
        </ScrollReveal>

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
          <div className="flex flex-col items-center gap-3 mt-6">
            {(mutation.error || checkoutError) && (
              <p
                role="alert"
                className="flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {(mutation.error as Error)?.message || checkoutError}
              </p>
            )}

            <button
              id="check-resume-btn"
              onClick={handleMainButtonClick}
              disabled={!canSubmit}
              aria-busy={mutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 px-6 sm:px-8 whitespace-nowrap min-w-[280px] text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {mutation.isPending || (progress.step > 0 && !result) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {pricing.is_free || !(resumeText.trim().length >= 50 && jobDesc.trim().length >= 30) ? (
                    "Check My Resume"
                  ) : (
                    <span>
                      Pay <span className="line-through mx-1 text-brand-foreground/70">₹{pricing.original_price}</span> ₹{pricing.price} & Check My Resume
                    </span>
                  )}
                </>
              )}
            </button>

            {!canSubmit && !mutation.isPending && (
              <p className="text-xs text-muted-foreground">
                {resumeText.trim().length < 50 && "Resume is too short. "}
                {jobDesc.trim().length < 30 && "Job description is too short. "}
                {(resumeText.trim().length >= 50 && jobDesc.trim().length >= 30) && "Please fill all required details."}
              </p>
            )}
          </div>

          {/* Loading progress */}
          {(mutation.isPending || (progress.step > 0 && !result)) && (
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
            <div ref={reportRef} className="bg-background">
              <AtsResultDisplay result={result} />
            </div>
            
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => {
                  window.open("https://omg10.com/4/11702415", "_blank");
                  generatePdf(false);
                }}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download Complete Report
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Promo — resume templates */}
        {!mutation.isPending && (
          <ScrollReveal delay={0.1}>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <Link
                to="/ats-friendly-resumes"
                className="glass flex items-center gap-4 rounded-2xl p-5 transition-all hover:shadow-sm hover:shadow-brand/10"
              >
                <FileText className="h-8 w-8 shrink-0 text-brand" />
                <div>
                  <p className="font-semibold">ATS Friendly Resumes</p>
                  <p className="text-sm text-muted-foreground">ATS-friendly resumes for freshers & professionals</p>
                </div>
              </Link>
              <Link
                to="/ats-resumes-pack"
                className="glass flex items-center gap-4 rounded-2xl p-5 transition-all hover:shadow-sm hover:shadow-brand/10"
              >
                <FileText className="h-8 w-8 shrink-0 text-brand" />
                <div>
                  <p className="font-semibold">ATS Resumes Pack</p>
                  <p className="text-sm text-muted-foreground">Resume + cover letter + outreach templates</p>
                </div>
              </Link>
            </div>
          </ScrollReveal>
        )}

        {/* How it works */}
        <ScrollReveal>
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
        </ScrollReveal>

        {/* Disclaimer */}
        <div className="mt-8 flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            This tool provides an ATS compatibility estimate based on keyword and content analysis. It does not
            guarantee job interview selection, ATS pass rates, or hiring outcomes. Results are informational only.
            Career Updates does not store or share resume content submitted through this tool.
          </p>
        </div>

      {/* Checkout Modal Overlay */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Complete Your Purchase</h2>
                  <p className="text-xs text-muted-foreground mt-1">Enter your details to proceed with the ATS check.</p>
                </div>
                <button 
                  onClick={() => setShowCheckoutModal(false)}
                  className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCheckoutAndAnalyze} className="space-y-4">
                {/* Error Message inside Modal */}
                {checkoutError && (
                  <div className="rounded-md bg-red-50 p-3 mb-4 flex items-start gap-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>{checkoutError}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      required
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="block w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      required
                      value={customer.fullName}
                      onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                      className="block w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="w-1/3 min-w-[100px]">
                      <select
                        value={customer.countryCode}
                        onChange={(e) => setCustomer({ ...customer, countryCode: e.target.value })}
                        className="block w-full rounded-md border border-input bg-background py-2 pl-2 pr-8 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      >
                        <option value="+91">🇮🇳 India (+91)</option>
                        <option value="+1">🇺🇸 US (+1)</option>
                        <option value="+44">🇬🇧 UK (+44)</option>
                        <option value="+61">🇦🇺 AUS (+61)</option>
                        <option value="+971">🇦🇪 UAE (+971)</option>
                        <option value="+65">🇸🇬 SG (+65)</option>
                      </select>
                    </div>
                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        required
                        value={customer.phone}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (customer.countryCode === "+91") {
                            val = val.replace(/\D/g, "").slice(0, 10);
                          }
                          setCustomer({ ...customer, phone: val });
                        }}
                        className="block w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        placeholder="8484153463"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground shadow-sm transition-transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-70"
                >
                  {mutation.isPending ? "Processing..." : `PAY ₹${pricing.price} & CHECK ATS`}
                </button>
                
                <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Secure checkout</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Instant result</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>

      <SiteFooter />
      <StickySocial />
    </div>
  );
}
