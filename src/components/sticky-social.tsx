import { MessageCircle, Send, Instagram } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteSettings } from "@/lib/site-settings.functions";

function isValidSocialUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("yourchannel") ||
    lower.includes("wa.me/...") ||
    lower.includes("instagram.com/...")
  ) {
    return false;
  }
  
  if (!lower.startsWith("https://") && !lower.startsWith("http://")) {
    return false;
  }

  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function StickySocial() {
  const get = useServerFn(getSiteSettings);
  const { data: settings } = useQuery({ 
    queryKey: ["site-settings"], 
    queryFn: () => get() 
  });

  const telegramUrl = settings?.telegram_url;
  const whatsappUrl = settings?.whatsapp_url;
  const instagramUrl = settings?.instagram_url;

  const showTelegram = isValidSocialUrl(telegramUrl);
  const showWhatsapp = isValidSocialUrl(whatsappUrl);
  const showInstagram = isValidSocialUrl(instagramUrl);

  // If no social links are configured, don't render the container at all
  if (!showTelegram && !showWhatsapp && !showInstagram) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-3 sm:bottom-6 sm:right-6 z-30 flex flex-col gap-2">
      {showTelegram && (
        <a
          href={telegramUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-telegram p-2.5 sm:px-4 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-telegram/30 transition-transform hover:scale-105"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Join Telegram</span>
        </a>
      )}
      
      {showWhatsapp && (
        <a
          href={whatsappUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp p-2.5 sm:px-4 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-whatsapp/30 transition-transform hover:scale-105"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp Channel</span>
        </a>
      )}
      
      {showInstagram && (
        <a
          href={instagramUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 p-2.5 sm:px-4 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition-transform hover:scale-105"
        >
          <Instagram className="h-4 w-4" />
          <span className="hidden sm:inline">Follow on Instagram</span>
        </a>
      )}
    </div>
  );
}
