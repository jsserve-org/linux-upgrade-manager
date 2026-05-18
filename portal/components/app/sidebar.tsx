"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Server,
  Activity,
  KeyRound,
  Terminal,
  ShieldAlert,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/instances", label: "Endpoints", icon: Server },
  { href: "/cves", label: "CVE feed", icon: Shield },
  { href: "/jobs", label: "Activity", icon: Activity },
];
const MGMT = [
  { href: "/enroll", label: "Enrollment", icon: KeyRound },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 flex h-screen w-[232px] flex-col border-r border-border bg-surface/60">
      {/* brand */}
      <div className="px-5 pb-5 pt-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative grid h-7 w-7 place-items-center rounded-md border border-accent/30 bg-accent/10 text-accent">
            <Terminal className="h-3.5 w-3.5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))] ring-2 ring-surface" />
          </span>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-tight text-foreground">
              Patchwerk
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              upgrade hub
            </div>
          </div>
        </Link>
      </div>

      {/* nav */}
      <nav className="flex flex-1 flex-col gap-6 px-3">
        <Section label="Monitor" items={NAV} isActive={isActive} />
        <Section label="Manage" items={MGMT} isActive={isActive} />
      </nav>

      {/* footer status pill */}
      <div className="mx-3 mb-4 rounded-md border border-border bg-background/40 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
            <span className="text-[11px] font-medium text-foreground/90">Hub healthy</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            v0.1.0
          </span>
        </div>
        <div className="mt-2 font-mono text-[10px] leading-tight text-muted-foreground">
          postgres · drizzle · bun-agent
        </div>
      </div>
    </aside>
  );
}

function Section({
  label,
  items,
  isActive,
}: {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutGrid }[];
  isActive: (h: string) => boolean;
}) {
  return (
    <div>
      <div className="px-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
        {label}
      </div>
      <ul className="flex flex-col gap-0.5">
        {items.map((n) => {
          const active = isActive(n.href);
          const Icon = n.icon;
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  active
                    ? "bg-background/70 text-foreground"
                    : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-[hsl(var(--accent))]" />
                )}
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 transition-colors",
                    active ? "text-[hsl(var(--accent))]" : "text-muted-foreground/70 group-hover:text-foreground"
                  )}
                />
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
