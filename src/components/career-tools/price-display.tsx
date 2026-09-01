/**
 * PriceDisplay — renders strikethrough original price + current price
 * Prices are stored as plain numbers in DB; currency formatting is done here.
 * Example: <PriceDisplay original={299} current={29} />
 * Renders: ~~₹299~~ ₹29
 */

interface PriceDisplayProps {
  original: number;
  current: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({ original, current, size = "md", className = "" }: PriceDisplayProps) {
  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  const sizes = {
    sm: { current: "text-base font-bold", original: "text-xs", currency: "text-xs" },
    md: { current: "text-xl font-bold", original: "text-sm", currency: "text-sm" },
    lg: { current: "text-3xl font-bold", original: "text-base", currency: "text-base" },
  };

  const cls = sizes[size];

  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`${cls.current} text-brand`}>
        <span className={cls.currency}>₹</span>
        {formatINR(current)}
      </span>
      <span className={`${cls.original} text-muted-foreground line-through`}>
        ₹{formatINR(original)}
      </span>
      {original > 0 && current < original && (
        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
          {Math.round(((original - current) / original) * 100)}% off
        </span>
      )}
    </div>
  );
}
