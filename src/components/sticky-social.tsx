import { MessageCircle, Send, Instagram } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteSettings } from "@/lib/site-settings.functions";

export function StickySocial() {
  const get = useServerFn(getSiteSettings);
  const { data: settings } = useQuery({ 
    queryKey: ["site-settings"], 
    queryFn: () => get() 
  });

  return (
    <div className="fixed bottom-24 right-3 sm:bottom-6 sm:right-6 z-30 flex flex-col gap-2">
      <a
        href={settings?.telegram_url || "https://t.me/careerupdate_in"}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center justify-center gap-2 rounded-full bg-telegram p-2.5 sm:px-4 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-telegram/30 transition-transform hover:scale-105"
      >
        <Send className="h-4 w-4" />
        <span className="hidden sm:inline">Join Telegram</span>
      </a>
      <a
        href={settings?.whatsapp_url || "https://whatsapp.com/channel/0029VbDWQziFi8xUacpWjx2K"}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp p-2.5 sm:px-4 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-whatsapp/30 transition-transform hover:scale-105"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">WhatsApp Channel</span>
      </a>
      <a
        href={settings?.instagram_url || "https://www.instagram.com/careerupdates_in?igsh=cXp1NTJ4cXZmMW92"}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 p-2.5 sm:px-4 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition-transform hover:scale-105"
      >
        <Instagram className="h-4 w-4" />
        <span className="hidden sm:inline">Follow on Instagram</span>
      </a>
    </div>
  );
}
