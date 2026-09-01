/**
 * Checks whether the RLS policy on site_settings allows an authenticated
 * admin to update the new ads columns. Tests using the publishable key
 * (as a logged-in user would) to simulate the actual server-function flow.
 *
 * Run: node scripts/check_ads_rls.cjs
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log("\n=== RLS / Column Permission Check ===\n");

  // 1. Service role — bypasses RLS; should always work
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log("1. Service-role UPDATE test...");
  const { data: srRow } = await admin.from("site_settings").select("id").limit(1).single();
  const { error: srErr } = await admin
    .from("site_settings")
    .update({ ads_enabled: true, ads_disabled_at: null, ads_auto_enable_at: null })
    .eq("id", srRow.id);
  if (srErr) console.error("   ❌ Service-role UPDATE FAILED:", srErr.message);
  else console.log("   ✅ Service-role UPDATE passed");

  // 2. Publishable key (anon role) — should be blocked by RLS
  const anon = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  });
  console.log("\n2. Anon UPDATE test (should fail)...");
  const { data: anonRow } = await anon.from("site_settings").select("id").limit(1).single();
  const { error: anonErr } = await anon
    .from("site_settings")
    .update({ ads_enabled: false })
    .eq("id", anonRow?.id);
  if (anonErr) console.log("   ✅ Anon UPDATE correctly blocked:", anonErr.message);
  else console.error("   ❌ Anon UPDATE should have been blocked!");

  // 3. Check the RLS policies on site_settings
  console.log("\n3. Checking RLS policies on site_settings...");
  const { data: policies, error: polErr } = await admin.rpc("get_policies_for_table", {
    table_name: "site_settings",
  });
  if (polErr) {
    // The RPC might not exist — query pg_policies directly
    const { data: pgPolicies, error: pgErr } = await admin
      .from("pg_policies")
      .select("policyname, cmd, qual")
      .eq("tablename", "site_settings");
    if (pgErr) {
      console.log("   (Cannot read pg_policies directly — check Supabase dashboard)");
    } else {
      console.log("   Policies:", JSON.stringify(pgPolicies, null, 2));
    }
  } else {
    console.log("   Policies:", JSON.stringify(policies, null, 2));
  }

  console.log("\n=== Check Complete ===\n");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
