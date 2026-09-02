import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/resume-bundles/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/ats-resumes-pack/$slug",
      params,
    });
  },
});
