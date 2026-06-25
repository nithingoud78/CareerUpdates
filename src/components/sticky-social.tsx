import { MessageCircle, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/lib/site-settings.functions";

export function StickySocial() {
  const get = useServerFn(getSiteSettings);
  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: () => get() });

  if (!data) return null;

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2">
      {data.telegram_url && (
        <a
          href={data.telegram_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full bg-telegram px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-telegram/30 transition-transform hover:scale-105"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Join Telegram</span>
        </a>
      )}
      {data.whatsapp_url && (
        <a
          href={data.whatsapp_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-whatsapp/30 transition-transform hover:scale-105"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp Channel</span>
        </a>
      )}
    </div>
  );
}
