import { cn } from "@/lib/cn";

export type BarItem = {
  label: string;
  value: number;
  /** explicit color (any CSS color or `hsl(var(--...))`). */
  color?: string;
};

export function BarList({
  items,
  total,
  className,
}: {
  items: BarItem[];
  total?: number;
  className?: string;
}) {
  const sum = total ?? items.reduce((s, i) => s + i.value, 0);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((i) => {
        const pct = sum ? Math.round((i.value / sum) * 100) : 0;
        return (
          <div key={i.label} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-foreground/90">{i.label}</span>
              <span className="tabular font-mono text-[11px] text-muted-foreground">
                {i.value}{" "}
                <span className="opacity-60">· {pct}%</span>
              </span>
            </div>
            <div className="col-span-2 h-[6px] overflow-hidden rounded-full bg-background/60">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: i.color ?? "hsl(var(--accent))",
                  boxShadow: i.color
                    ? `0 0 12px ${i.color}55`
                    : "0 0 12px hsl(var(--accent) / 0.4)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StackedBar({
  items,
  className,
}: {
  items: BarItem[];
  className?: string;
}) {
  const sum = items.reduce((s, i) => s + i.value, 0);
  if (!sum) {
    return (
      <div
        className={cn(
          "h-2 w-full overflow-hidden rounded-full bg-background/60",
          className
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-2 w-full overflow-hidden rounded-full bg-background/60",
        className
      )}
    >
      {items.map((i) => (
        <div
          key={i.label}
          style={{
            width: `${(i.value / sum) * 100}%`,
            background: i.color ?? "hsl(var(--accent))",
          }}
          title={`${i.label} · ${i.value}`}
        />
      ))}
    </div>
  );
}
