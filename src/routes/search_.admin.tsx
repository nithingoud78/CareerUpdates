import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/search_/admin")({
  beforeLoad: () => {
    throw redirect({
      to: "/admin",
    });
  },
});
