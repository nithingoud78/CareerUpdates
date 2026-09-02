import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/resume-bundles/")({
  beforeLoad: () => {
    throw redirect({
      to: "/ats-resumes-pack",
    });
  },
});
