/**
 * insert_blogs_via_api.ts
 * 
 * Executes the new blog articles SQL migration directly via Supabase REST API.
 * Reads the migration file and runs it against the database.
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as dotenv_module from "dotenv";

dotenv_module.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runSQL(sql: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
    
    const data = JSON.stringify({ sql_query: sql });
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "apikey": SERVICE_ROLE_KEY,
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || "{}"));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const migrationPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260831120000_new_blog_articles.sql"
  );
  
  console.log(`Reading migration from: ${migrationPath}`);
  
  if (!fs.existsSync(migrationPath)) {
    console.error("Migration file not found!");
    process.exit(1);
  }
  
  const sql = fs.readFileSync(migrationPath, "utf-8");
  console.log(`Migration file size: ${sql.length} bytes`);
  
  try {
    console.log("Executing migration via Supabase REST API...");
    await runSQL(sql);
    console.log("✅ Migration executed successfully!");
  } catch (err: any) {
    console.error("❌ Failed via RPC. Trying direct insert approach...");
    console.error(err.message);
  }
}

main();
