export function stripHtmlToMarkdown(html: string) {
  let md = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ");

  // Convert basic formatting
  md = md.replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, "\n## $1\n");
  md = md.replace(/<h[4-6][^>]*>(.*?)<\/h[4-6]>/gi, "\n### $1\n");
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "\n- $1");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n");

  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, " ");

  // Decode basic entities
  md = md
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&bull;/g, "-")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "—")
    .replace(/&copy;/g, "©")
    .replace(/&reg;/g, "®");

  // Clean whitespace
  md = md.replace(/[ \t]+/g, " ");
  md = md.replace(/\n\s*\n\s*\n/g, "\n\n");

  return md.trim();
}

export function assessContentQuality(text: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  
  if (!text || text.trim().length === 0) {
    reasons.push("Empty description");
    return { score: 0, reasons };
  }

  let score = 100;
  const lower = text.toLowerCase();

  if (text.trim().length < 200) {
    score = Math.min(score, 40);
    reasons.push("Description length < 200");
  }

  if (text.includes('{"@context"') || text.includes('{"@type"')) {
    score -= 40;
    reasons.push("Schema.org / JSON-LD blocks");
  }

  const braceMatches = text.match(/\{[\s\S]{10,200}?\}/g);
  if (braceMatches && braceMatches.length > 3 && braceMatches.some(m => m.includes('"'))) {
    score -= 30;
    reasons.push("JSON fragments");
  }

  const navTerms = [
    'privacy policy', 'terms of service', 'cookie policy', 'all rights reserved',
    'skip to main content', 'choose your language', 'select country', 'language selector'
  ];
  let navCount = 0;
  for (const term of navTerms) {
    if (lower.includes(term)) navCount++;
  }
  if (navCount > 0) {
    score -= (navCount * 10);
    reasons.push(`${navCount} navigation/footer keywords`);
  }

  if (/\bfunction\s*\(/.test(text) || /\bconst\s+\w+\s*=/.test(text) || /\bwindow\.\w+/.test(text)) {
    score -= 30;
    reasons.push("JavaScript code");
  }

  if ((lower.match(/about us/g) || []).length > 2) {
    score -= 15;
    reasons.push("Excessive repetition (branding)");
  }

  if (text.includes('&amp;') || text.includes('&lt;') || text.includes('&quot;')) {
    score -= 10;
    reasons.push("HTML entities");
  }

  const urlCount = (text.match(/https?:\/\/[^\s]+/g) || []).length;
  if (urlCount > 2) {
    score -= Math.min(urlCount * 5, 20);
    reasons.push("Raw URLs");
  }

  return { score: Math.max(0, score), reasons };
}
export async function extractJobPage(url: string): Promise<string> {
  try {
    const jina = await fetch(`https://r.jina.ai/http://${url}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CareerUpdatesBot/1.0; +https://careerupdates.app)",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (jina.ok) {
      const text = await jina.text();
      if (text.length > 500) return text.slice(0, 30000);
    }
  } catch {}

  try {
    const html = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CareerUpdatesBot/1.0; +https://careerupdates.app)",
      },
      signal: AbortSignal.timeout(15000),
    });
    const text = stripHtmlToMarkdown(await html.text());
    if (text.length > 500) return text.slice(0, 30000);
  } catch {}

  return "";
}
