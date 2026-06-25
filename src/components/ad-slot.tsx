import { cn } from "@/lib/utils";

interface AdSlotProps {
  label?: string;
  className?: string;
}

/**
 * Placeholder for Google AdSense slots. Replace inner content with the
 * AdSense ins-tag when an AdSense account is connected.
 */
export function AdSlot({ label = "Advertisement", className }: AdSlotProps) {
  return (
    <div className="flex justify-center w-full my-6 overflow-hidden">
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground",
          "w-[320px] h-[100px] md:w-[728px] md:h-[90px]",
          className,
        )}
        aria-label="Ad placement"
      >
        {label}
      </div>
    </div>
  );
}
