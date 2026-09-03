import { useState } from "react";
import { MessageCircle, Send, Instagram, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { motion, useReducedMotion, Variants } from "framer-motion";

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
  const contactEmail = settings?.contact_email;

  const showTelegram = isValidSocialUrl(telegramUrl);
  const showWhatsapp = isValidSocialUrl(whatsappUrl);
  const showInstagram = isValidSocialUrl(instagramUrl);
  const showContact = !!contactEmail?.trim();

  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = prefersReducedMotion || isHovered;

  // If no social links or email are configured, don't render the container at all
  if (!showTelegram && !showWhatsapp && !showInstagram && !showContact) {
    return null;
  }

  const containerVariants: Variants = {
    collapsed: {
      transition: { staggerChildren: 0.03, staggerDirection: -1 }
    },
    expanded: {
      transition: { staggerChildren: 0.03 }
    }
  };

  const itemVariants: Variants = {
    collapsed: { 
      opacity: 0, 
      y: 15, 
      scale: 0.9,
      pointerEvents: "none",
      transition: { type: "spring", stiffness: 400, damping: 30 }
    },
    expanded: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      pointerEvents: "auto",
      transition: { type: "spring", stiffness: 400, damping: 30 }
    }
  };

  return (
    <motion.div 
      className={`fixed bottom-24 right-3 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end gap-2 ${isExpanded ? 'pointer-events-auto' : 'pointer-events-none'}`}
      initial={prefersReducedMotion ? "expanded" : "collapsed"}
      animate={isExpanded ? "expanded" : "collapsed"}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => setIsHovered(!isHovered)}
      variants={containerVariants}
    >
      {showInstagram && (
        <motion.a
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          href={instagramUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 p-2.5 sm:px-4 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/30"
        >
          <Instagram className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Follow on Instagram</span>
        </motion.a>
      )}
      
      {showWhatsapp && (
        <motion.a
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          href={whatsappUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp p-2.5 sm:px-4 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-whatsapp/30"
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">WhatsApp Channel</span>
        </motion.a>
      )}
      
      {showTelegram && (
        <motion.a
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          href={telegramUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-telegram p-2.5 sm:px-4 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-telegram/30"
        >
          <Send className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Join Telegram</span>
        </motion.a>
      )}

      {showContact && (
        <motion.a
          layout
          whileHover={{ scale: 1.05 }}
          href={`mailto:${contactEmail}`}
          className="pointer-events-auto group relative z-10 flex items-center justify-center rounded-full bg-slate-800 p-3 text-sm font-semibold text-white shadow-lg shadow-slate-800/30"
        >
          <Mail className="h-5 w-5 shrink-0" />
          <motion.span 
            className="overflow-hidden whitespace-nowrap block"
            variants={{
              collapsed: { width: 0, opacity: 0, marginLeft: 0 },
              expanded: { width: "auto", opacity: 1, marginLeft: 8 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            Contact
          </motion.span>
        </motion.a>
      )}
    </motion.div>
  );
}
