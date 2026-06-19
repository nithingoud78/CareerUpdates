import { MessageCircle, Send } from "lucide-react";

export function StickySocial() {
  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2">
      <a
        href="https://t.me/"
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 rounded-full bg-telegram px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-telegram/30 transition-transform hover:scale-105"
      >
        <Send className="h-4 w-4" />
        <span className="hidden sm:inline">Join Telegram</span>
      </a>
      <a
        href="https://whatsapp.com/channel/"
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-whatsapp/30 transition-transform hover:scale-105"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">WhatsApp Channel</span>
      </a>
    </div>
  );
}
