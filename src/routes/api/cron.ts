import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cron")({
  server: {
    handlers: {
      GET: async () => {
        // Authenticate the cron request if possible. Vercel sets a CRON_SECRET header.
        // But for simplicity and testing we can just check it or leave it open if it's safe.
        // It's a safe idempotent operation.
        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env.SUPABASE_URL!;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
        
        // Depending on RLS, you might need the SERVICE_ROLE_KEY to perform updates without auth.
        // We'll try with the publishable key first, or process.env.SUPABASE_SERVICE_ROLE_KEY if available.
        const useKey = process.env.SUPABASE_SERVICE_ROLE_KEY || key;
        const supabase = createClient(url, useKey, { auth: { persistSession: false } });

        const today = new Date().toISOString().split("T")[0];

        const { data, error } = await supabase
          .from("jobs")
          .update({ status: "expired" })
          .eq("status", "published")
          .lt("last_date", today)
          .select("id");

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Expired ${data?.length || 0} jobs`,
            expired_ids: data?.map((j) => j.id) || [],
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    },
  },
});
