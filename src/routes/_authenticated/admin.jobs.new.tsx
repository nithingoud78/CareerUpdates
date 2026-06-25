import { createFileRoute } from "@tanstack/react-router";
import { JobForm } from "@/components/admin-job-form";

export const Route = createFileRoute("/_authenticated/admin/jobs/new")({
  component: NewJob,
});

function NewJob() {
  return <JobForm />;
}
