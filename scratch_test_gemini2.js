import { config } from "dotenv";
config();

async function main() {
  const url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;
  const body = JSON.stringify({
    model: "gemini-1.5-flash",
    messages: [{ role: "user", content: "Hello" }]
  });

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GOOGLE_API_KEY}`
    },
    body
  });
  console.log("Bearer Status:", resp.status);
  console.log("Bearer Response:", await resp.text());
}
main();
