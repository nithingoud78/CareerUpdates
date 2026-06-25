import { createFileRoute } from "@tanstack/react-router";
import { JobForm, JobFormType } from "@/components/admin-job-form";
import { getJobBySlug } from "@/lib/admin-jobs.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/admin/jobs/$slug/edit")({
  component: EditJob,
});

function EditJob() {
  const { slug } = Route.useParams();
  const getJob = useServerFn(getJobBySlug);
  
  const { data: job, isLoading, error } = useQuery({
    queryKey: ["adminJob", slug],
    queryFn: () => getJob({ data: slug }),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading job details...</div>;
  }
  
  if (error) {
    return <div className="p-8 text-center text-sm text-destructive">Error loading job: {error.message}</div>;
  }
  
  if (!job) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Job not found.</div>;
  }

  // Map the database tags array to comma separated string if it's an array
  const initialData = {
    ...job,
    tags: Array.isArray(job.tags) ? job.tags.join(", ") : job.tags || "",
  };

  return <JobForm mode="edit" initialData={initialData as Partial<JobFormType>} />;
}
