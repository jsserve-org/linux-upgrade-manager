import { cn } from "@/lib/cn";

type Status = "online" | "stale" | "offline" | "unknown" | "warn" | "danger";

const STYLES: Record<Status, { dot: string; ring: string; pulse: boolean }> = {
  online:  { dot: "bg-[hsl(var(--accent))]", ring: "bg-[hsl(var(--accent))]/30", pulse: true },
  stale:   { dot: "bg-[hsl(var(--warn))]",   ring: "bg-[hsl(var(--warn))]/30",   pulse: false },
  offline: { dot: "bg-[hsl(var(--danger))]", ring: "bg-[hsl(var(--danger))]/25", pulse: false },
  unknown: { dot: "bg-muted-foreground/60",   ring: "bg-muted-foreground/15",     pulse: false },
  warn:    { dot: "bg-[hsl(var(--warn))]",   ring: "bg-[hsl(var(--warn))]/30",   pulse: false },
  danger:  { dot: "bg-[hsl(var(--danger))]", ring: "bg-[hsl(var(--danger))]/30", pulse: false },
};

export function StatusDot({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const s = STYLES[status];
  return (
    <span className={cn("relative inline-flex h-2 w-2 items-center justify-center", className)}>
      {s.pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full motion-safe:animate-ping",
            s.ring
          )}
          style={{ animationDuration: "1800ms" }}
        />
      )}
      <span className={cn("relative h-2 w-2 rounded-full", s.dot)} />
    </span>
  );
}

export function StatusLabel({
  status,
  label,
}: {
  status: Status;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground/90">
      <StatusDot status={status} />
      {label}
    </span>
  );
}
