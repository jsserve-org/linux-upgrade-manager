import { cn } from "@/lib/cn";

const TONE = {
  CRITICAL: "border-danger/40 bg-danger/15 text-[hsl(var(--danger))]",
  HIGH:     "border-danger/30 bg-danger/10 text-[hsl(var(--danger))]",
  MEDIUM:   "border-warn/30 bg-warn/10 text-[hsl(var(--warn))]",
  LOW:      "border-accent/30 bg-accent/10 text-[hsl(var(--accent))]",
  NONE:     "border-border-strong bg-subtle text-muted-foreground",
  UNKNOWN:  "border-border-strong bg-subtle text-muted-foreground",
} as const;

export function SeverityBadge({
  severity,
  score,
  className,
}: {
  severity: keyof typeof TONE | string;
  score?: number | null;
  className?: string;
}) {
  const tone = (TONE as any)[severity] ?? TONE.UNKNOWN;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.1em]",
        tone,
        className
      )}
    >
      <span>{severity}</span>
      {score != null && (
        <span className="opacity-70">{(score / 10).toFixed(1)}</span>
      )}
    </span>
  );
}
