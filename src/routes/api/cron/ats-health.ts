import { json } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { runAtsHealthCheck } from "../../../lib/ats-settings.functions";

export async function POST(request: Request) {
  // Optional: check Authorization header if VERCEL_CRON_SECRET is set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return json({ error: "Supabase credentials missing" }, { status: 500 });
  }

  // Use service role to bypass RLS for cron
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const result = await runAtsHealthCheck(supabaseAdmin);
    return json(result);
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
}

export const GET = POST;
