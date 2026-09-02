import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/resume-templates/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/ats-friendly-resumes/$slug",
      params,
    });
  },
});
