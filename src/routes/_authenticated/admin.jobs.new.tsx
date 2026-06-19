import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { extractJobFromUrl, regenerateSummary } from "@/lib/ai.functions";
import { upsertJob } from "@/lib/admin-jobs.functions";

export const Route = createFileRoute("/_authenticated/admin/jobs/new")({
  component: NewJob,
});

type Form = {
  slug: string;
  title: string;
  company: string;
  company_logo: string;
  location: string;
  experience: string;
  salary: string;
  employment_type: string;
  qualification: string;
  category: string;
  apply_url: string;
  description: string;
  ai_summary: string;
  meta_description: string;
  tags: string;
  status: "published";
  last_date: string;
};

const empty: Form = {
  slug: "", title: "", company: "", company_logo: "", location: "", experience: "",
  salary: "", employment_type: "", qualification: "", category: "",
  apply_url: "", description: "", ai_summary: "", meta_description: "",
  tags: "", status: "published", last_date: "",
};

function NewJob() {
  const navigate = useNavigate();
  const extract = useServerFn(extractJobFromUrl);
  const regen = useServerFn(regenerateSummary);
  const save = useServerFn(upsertJob);

  const [url, setUrl] = useState("");
  const [form, setForm] = useState<Form>(empty);
  const [err, setErr] = useState<string | null>(null);

  const extractMut = useMutation({
    mutationFn: (u: string) => extract({ data: { url: u } }),
    onSuccess: (data: any) => {
      setForm({
        ...empty,
        ...data,
        tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
        last_date: data.last_date || "",
      });
      setErr(null);
    },
    onError: (e: any) => setErr(e.message),
  });

  const regenMut = useMutation({
    mutationFn: () => regen({ data: { title: form.title, company: form.company, description: form.description } }),
    onSuccess: (d: any) => {
      setForm((f) => ({
        ...f,
        ai_summary: d.ai_summary ?? f.ai_summary,
        meta_description: d.meta_description ?? f.meta_description,
        tags: Array.isArray(d.tags) ? d.tags.join(", ") : f.tags,
      }));
    },
    onError: (e: any) => setErr(e.message),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          ...form,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          last_date: form.last_date || null,
          company_logo: form.company_logo || null,
          location: form.location || null,
          experience: form.experience || null,
          salary: form.salary || null,
          employment_type: form.employment_type || null,
          qualification: form.qualification || null,
          category: form.category || null,
          description: form.description || null,
          ai_summary: form.ai_summary || null,
          meta_description: form.meta_description || null,
        },
      }),
    onSuccess: () => navigate({ to: "/admin" }),
    onError: (e: any) => setErr(e.message),
  });

  const set = <K extends keyof Form>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Create new job</h1>
        <p className="text-sm text-muted-foreground">Paste the official URL, let AI extract details, review and publish.</p>
      </header>

      {/* Step 1: URL extract */}
      <section className="glass rounded-2xl p-5">
        <label className="text-sm font-semibold">Official Job URL</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://careers.company.com/job/123"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={() => url && extractMut.mutate(url)}
            disabled={!url || extractMut.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {extractMut.isPending ? "Extracting…" : "Generate Details with AI"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Works with most career pages. Fill in or correct any field manually below before publishing.
        </p>
      </section>

      {err && (
        <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{err}</div>
      )}

      {/* Step 2: Edit form */}
      <section className="glass space-y-4 rounded-2xl p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job Title" value={form.title} onChange={set("title")} />
          <Field label="Company" value={form.company} onChange={set("company")} />
          <Field label="Slug (URL)" value={form.slug} onChange={set("slug")} />
          <Field label="Category" value={form.category} onChange={set("category")} placeholder="IT, Government, Internship…" />
          <Field label="Location" value={form.location} onChange={set("location")} />
          <Field label="Experience" value={form.experience} onChange={set("experience")} />
          <Field label="Salary" value={form.salary} onChange={set("salary")} />
          <Field label="Employment Type" value={form.employment_type} onChange={set("employment_type")} />
          <Field label="Qualification" value={form.qualification} onChange={set("qualification")} />
          <Field label="Company Logo URL" value={form.company_logo} onChange={set("company_logo")} />
          <Field label="Apply URL" value={form.apply_url} onChange={set("apply_url")} type="url" />
          <Field label="Last Date" value={form.last_date} onChange={set("last_date")} type="date" />
        </div>

        <TextArea label="Description" value={form.description} onChange={set("description")} rows={5} />

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">AI-Generated Fields</h3>
          <button
            onClick={() => regenMut.mutate()}
            disabled={!form.title || regenMut.isPending}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-60"
          >
            <Wand2 className="h-3 w-3" />
            {regenMut.isPending ? "Generating…" : "Regenerate Summary"}
          </button>
        </div>
        <TextArea label="AI Summary" value={form.ai_summary} onChange={set("ai_summary")} rows={3} />
        <TextArea label="Meta Description (SEO)" value={form.meta_description} onChange={set("meta_description")} rows={2} />
        <Field label="Tags (comma separated)" value={form.tags} onChange={set("tags")} />

        <div className="flex items-center justify-end border-t border-border pt-4">
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !form.title || !form.slug || !form.apply_url || !form.company}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-60"
          >
            {saveMut.isPending ? "Publishing…" : "Publish Job"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}
