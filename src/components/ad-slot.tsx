import { cn } from "@/lib/utils";

interface AdSlotProps {
  label?: string;
  className?: string;
  height?: number;
}

/**
 * Placeholder for Google AdSense slots. Replace inner content with the
 * AdSense ins-tag when an AdSense account is connected.
 */
export function AdSlot({ label = "Advertisement", className, height = 90 }: AdSlotProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground",
        className,
      )}
      style={{ minHeight: height }}
      aria-label="Ad placement"
    >
      {label}
    </div>
  );
}
