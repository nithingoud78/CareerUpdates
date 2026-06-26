import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
}

export function Logo({ className, iconClassName }: LogoProps) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground shadow-sm",
        "h-9 w-9", // default wrapper size
        className
      )}
    >
      <img
        src="/custom-icon.png"
        alt="Career Updates Logo"
        className={cn("h-8 w-8 object-contain", iconClassName)}
      />
    </span>
  );
}
