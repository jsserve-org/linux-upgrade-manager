"use client";
import { Search, Command, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const pathname = usePathname();
  const segments = pathname === "/" ? ["Overview"] : pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-4 border-b border-border bg-background/85 px-8 backdrop-blur-md">
      {/* breadcrumb */}
      <nav className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <Link href="/" className="hover:text-foreground">hub</Link>
        {segments.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="text-muted-foreground/40">/</span>
            <span className={i === segments.length - 1 ? "text-foreground" : ""}>
              {s.length > 8 ? s.slice(0, 8) + "…" : s}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      {/* search */}
      <div className="relative w-72">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
        <input
          placeholder="Search endpoints, jobs, packages…"
          className="h-7 w-full rounded-md border border-border bg-background/40 pl-8 pr-12 text-xs placeholder:text-muted-foreground/70 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
          <Command className="h-2.5 w-2.5" /> K
        </kbd>
      </div>

      <button className="relative grid h-7 w-7 place-items-center rounded-md border border-border bg-background/40 text-muted-foreground hover:text-foreground">
        <Bell className="h-3.5 w-3.5" />
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
      </button>

      <UserMenu />
    </header>
  );
}
