import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

export function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  spark,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "accent" | "warn" | "danger";
  spark?: number[];
}) {
  const toneCls = {
    default: "text-muted-foreground",
    accent: "text-[hsl(var(--accent))]",
    warn: "text-[hsl(var(--warn))]",
    danger: "text-[hsl(var(--danger))]",
  }[tone];

  const max = spark ? Math.max(1, ...spark) : 1;

  return (
    <div className="metric-glow rounded-md border border-border bg-subtle/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="tabular text-[28px] font-medium leading-none tracking-tight text-foreground">
              {value}
            </div>
            {hint && (
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                {hint}
              </div>
            )}
          </div>
        </div>
        <div className={cn("rounded-md border border-border bg-background/40 p-1.5", toneCls)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      {spark && spark.length > 0 && (
        <div className="sparkbar mt-3">
          {spark.map((v, i) => (
            <span key={i} style={{ height: `${(v / max) * 100}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
