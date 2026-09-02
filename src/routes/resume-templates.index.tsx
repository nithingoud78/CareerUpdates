import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/resume-templates/")({
  beforeLoad: () => {
    throw redirect({
      to: "/ats-friendly-resumes",
    });
  },
});
