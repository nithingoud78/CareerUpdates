import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/resume-bundles")({
  beforeLoad: () => {
    throw redirect({
      to: "/admin/resume-packs",
      replace: true,
    });
  },
});
