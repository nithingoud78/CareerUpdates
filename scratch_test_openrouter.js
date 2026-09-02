import { config } from "dotenv";

config();

async function main() {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const body = JSON.stringify({
    model: "google/gemini-1.5-flash",
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 10,
  });

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://careerupdates.co.in",
      "X-Title": "Career Updates ATS Checker",
    },
    body,
  });
  
  console.log("Status:", resp.status);
  console.log("Response:", await resp.text());
}

main();
