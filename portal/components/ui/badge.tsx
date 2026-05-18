import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider font-mono",
  {
    variants: {
      variant: {
        default: "border-border-strong bg-subtle text-muted-foreground",
        accent: "border-accent/30 bg-accent/10 text-[hsl(var(--accent))]",
        warn: "border-warn/30 bg-warn/10 text-[hsl(var(--warn))]",
        danger: "border-danger/30 bg-danger/10 text-[hsl(var(--danger))]",
        outline: "border-border bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
