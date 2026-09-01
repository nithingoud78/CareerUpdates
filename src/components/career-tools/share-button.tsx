import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ url, title = "Share with Friends" }: { url: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers (rare but possible)
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-medium transition-colors
        ${copied 
          ? "border-green-600 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400" 
          : "border-border bg-surface text-muted-foreground hover:bg-accent"
        }`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" /> Link copied!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" /> {title}
        </>
      )}
    </button>
  );
}
