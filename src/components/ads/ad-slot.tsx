import { useAdContext } from "./ad-provider";
import { adConfig } from "./ad-config";

interface AdSlotProps {
  placement?: keyof typeof adConfig.placements;
  className?: string;
  // If a specific zone ID is needed for this slot, otherwise defaults to global
  zoneId?: string;
}

export function AdSlot({ placement, className = "", zoneId }: AdSlotProps) {
  const { enabled, adBlockDetected } = useAdContext();

  // If ads are disabled globally or for this specific placement, render nothing.
  if (!enabled || (placement && !adConfig.placements[placement])) {
    return null;
  }

  // If we know for sure AdBlock is active, collapse the space (render nothing).
  if (adBlockDetected === true) {
    return null;
  }

  // Otherwise, render a transparent container for Monetag to potentially target.
  // We do NOT use static "ADVERTISEMENT" text or hard borders.
  return (
    <div 
      className={`ad-container flex justify-center w-full overflow-hidden ${className}`}
      data-zone={zoneId || adConfig.zoneId}
      aria-hidden="true"
    />
  );
}
