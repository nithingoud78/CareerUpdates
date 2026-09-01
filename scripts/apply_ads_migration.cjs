/**
 * Diagnostic script — checks whether the ads columns exist on site_settings
 * and applies them if they are missing. Also verifies the site_settings row.
 *
 * Run: node scripts/apply_ads_migration.cjs
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("\n=== Ads Migration Diagnostic ===\n");

  // 1. Check whether the columns already exist by selecting them
  console.log("1. Checking if ads columns exist on site_settings...");
  const { data: colCheck, error: colErr } = await supabase
    .from("site_settings")
    .select("id, ads_enabled, ads_disabled_at, ads_auto_enable_at")
    .limit(1);

  if (colErr) {
    const msg = colErr.message || JSON.stringify(colErr);
    if (msg.includes("does not exist") || msg.includes("column")) {
      console.log("   ❌ Columns are MISSING. Applying migration now...\n");
      await applyMigration();
    } else {
      console.error("   ❌ Unexpected Supabase error:", msg);
      process.exit(1);
    }
  } else {
    console.log("   ✅ Columns already exist:", JSON.stringify(colCheck));
  }

  // 2. Check the actual row
  console.log("\n2. Reading current site_settings row...");
  const { data: row, error: rowErr } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .single();

  if (rowErr) {
    console.error("   ❌ Could not read row:", rowErr.message);
  } else {
    console.log("   ✅ Row:", JSON.stringify(row, null, 2));
  }

  // 3. Test the UPDATE — simulate turning ads OFF
  console.log("\n3. Testing UPDATE (set ads_enabled = false)...");
  const now = new Date();
  const autoEnableAt = new Date(now.getTime() + 60 * 60 * 1000);

  const { data: updRow, error: updErr } = await supabase
    .from("site_settings")
    .update({
      ads_enabled: false,
      ads_disabled_at: now.toISOString(),
      ads_auto_enable_at: autoEnableAt.toISOString(),
    })
    .eq("id", row.id)
    .select("id, ads_enabled, ads_disabled_at, ads_auto_enable_at");

  if (updErr) {
    console.error("   ❌ UPDATE FAILED:", updErr.message);
    console.error("   Full error:", JSON.stringify(updErr));
  } else {
    console.log("   ✅ UPDATE succeeded:", JSON.stringify(updRow));
  }

  // 4. Restore to ON
  console.log("\n4. Restoring ads_enabled = true...");
  const { error: restErr } = await supabase
    .from("site_settings")
    .update({ ads_enabled: true, ads_disabled_at: null, ads_auto_enable_at: null })
    .eq("id", row.id);

  if (restErr) {
    console.error("   ❌ Restore FAILED:", restErr.message);
  } else {
    console.log("   ✅ Restored to ON");
  }

  console.log("\n=== Diagnostic Complete ===\n");
}

async function applyMigration() {
  // We use the Supabase Management API to execute DDL since the client SDK
  // does not expose raw SQL. The service-role key cannot execute arbitrary DDL
  // via PostgREST. We must use the Supabase SQL API endpoint.
  const projectRef = SUPABASE_URL.split("//")[1].split(".")[0];
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const sql = `
    ALTER TABLE site_settings
      ADD COLUMN IF NOT EXISTS ads_enabled BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS ads_disabled_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS ads_auto_enable_at TIMESTAMPTZ;
    UPDATE site_settings SET ads_enabled = true WHERE ads_enabled IS NULL;
  `;

  console.log("   Attempting Management API (requires SUPABASE_ACCESS_TOKEN)...");

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    console.log("\n   ⚠️  SUPABASE_ACCESS_TOKEN not set.\n");
    console.log("   To apply the migration manually, run this SQL in the Supabase dashboard:");
    console.log("   https://supabase.com/dashboard/project/bcsoykjrwnrzkqacnkgr/sql\n");
    console.log("   --- SQL TO RUN ---");
    console.log(sql);
    console.log("   --- END SQL ---\n");
    console.log("   OR: add SUPABASE_ACCESS_TOKEN to .env and re-run this script.\n");
    process.exit(1);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.json();
  if (!res.ok) {
    console.error("   ❌ Management API failed:", JSON.stringify(body));
    process.exit(1);
  }
  console.log("   ✅ Migration applied via Management API");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
