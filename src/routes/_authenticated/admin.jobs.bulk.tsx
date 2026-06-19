import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { extractJobFromUrl } from "@/lib/ai.functions";
import { upsertJob } from "@/lib/admin-jobs.functions";

export const Route = createFileRoute("/_authenticated/admin/jobs/bulk")({
  component: BulkJobImport,
});

type ProcessState = "idle" | "processing" | "done";

type JobResult = {
  url: string;
  status: "pending" | "processing" | "created" | "updated" | "failed";
  error?: string;
};

function BulkJobImport() {
  const navigate = useNavigate();
  const extract = useServerFn(extractJobFromUrl);
  const save = useServerFn(upsertJob);

  const [urlsInput, setUrlsInput] = useState("");
  const [results, setResults] = useState<JobResult[]>([]);
  const [processState, setProcessState] = useState<ProcessState>("idle");

  const startProcessing = async () => {
    const urls = urlsInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0 && u.startsWith("http"));

    if (urls.length === 0) return;

    const initialResults: JobResult[] = urls.map((url) => ({
      url,
      status: "pending",
    }));

    setResults(initialResults);
    setProcessState("processing");

    // Process sequentially
    for (let i = 0; i < urls.length; i++) {
      const currentUrl = urls[i];

      setResults((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "processing" } : r))
      );

      try {
        // 1. Extract
        const extractedData = await extract({ data: { url: currentUrl } });
        
        // 2. Save/Upsert
        const payload = {
          ...extractedData,
          tags: Array.isArray(extractedData.tags) ? extractedData.tags : [],
          last_date: extractedData.last_date || null,
          company_logo: extractedData.company_logo || null,
          location: extractedData.location || null,
          experience: extractedData.experience || null,
          salary: extractedData.salary || null,
          employment_type: extractedData.employment_type || null,
          qualification: extractedData.qualification || null,
          category: extractedData.category || null,
          description: extractedData.description || null,
          ai_summary: extractedData.ai_summary || null,
          meta_description: extractedData.meta_description || null,
          status: "published" as const,
        };

        const res = await save({ data: payload });

        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: res.action === "created" ? "created" : "updated" } : r
          )
        );
      } catch (err: any) {
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: "failed", error: err.message || "Unknown error" } : r
          )
        );
      }
    }

    setProcessState("done");
  };

  const summary = results.reduce(
    (acc, curr) => {
      if (curr.status === "created") acc.created++;
      if (curr.status === "updated") acc.updated++;
      if (curr.status === "failed") acc.failed++;
      return acc;
    },
    { created: 0, updated: 0, failed: 0 }
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Bulk Job Import</h1>
        <p className="text-sm text-muted-foreground">
          Paste multiple official URLs (one per line). The AI will extract details and automatically publish or update existing jobs.
        </p>
      </header>

      {/* Input Section */}
      <section className="glass rounded-2xl p-5">
        <label className="text-sm font-semibold">Job URLs</label>
        <textarea
          value={urlsInput}
          onChange={(e) => setUrlsInput(e.target.value)}
          placeholder="https://careers.company1.com/job/123&#10;https://careers.company2.com/job/456"
          rows={8}
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand"
          disabled={processState === "processing"}
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={startProcessing}
            disabled={!urlsInput.trim() || processState === "processing"}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
          >
            {processState === "processing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Start Bulk Import
              </>
            )}
          </button>
        </div>
      </section>

      {/* Results Section */}
      {results.length > 0 && (
        <section className="glass space-y-4 rounded-2xl p-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-lg font-semibold">Processing Results</h2>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">Created: {summary.created}</span>
              <span className="text-blue-600 font-medium">Updated: {summary.updated}</span>
              <span className="text-red-600 font-medium">Failed: {summary.failed}</span>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-start justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3 truncate max-w-[80%]">
                  {r.status === "pending" && <div className="h-2 w-2 rounded-full bg-muted-foreground" />}
                  {r.status === "processing" && <Loader2 className="h-4 w-4 animate-spin text-brand" />}
                  {r.status === "created" && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                  {r.status === "updated" && <RefreshCw className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                  {r.status === "failed" && <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                  
                  <span className="truncate text-muted-foreground" title={r.url}>
                    {r.url}
                  </span>
                </div>
                
                <div className="ml-4 flex-shrink-0 text-xs font-medium">
                  {r.status === "pending" && <span className="text-muted-foreground">Pending</span>}
                  {r.status === "processing" && <span className="text-brand">Processing</span>}
                  {r.status === "created" && <span className="text-green-600">Created</span>}
                  {r.status === "updated" && <span className="text-blue-600">Updated</span>}
                  {r.status === "failed" && <span className="text-red-600" title={r.error}>Failed</span>}
                </div>
              </div>
            ))}
          </div>
          
          {processState === "done" && (
             <div className="mt-4 flex justify-end">
                <button
                  onClick={() => navigate({ to: "/admin" })}
                  className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
                >
                  Return to Dashboard
                </button>
             </div>
          )}
        </section>
      )}
    </div>
  );
}
