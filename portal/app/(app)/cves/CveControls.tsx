"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Loader2, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

const SEV = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
type Sev = (typeof SEV)[number];

export function CveFilters({
  initialQ,
  initialSeverity,
  initialCpe,
}: {
  initialQ: string;
  initialSeverity: string[];
  initialCpe: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = React.useState(initialQ);
  const [cpe, setCpe] = React.useState(initialCpe);
  const sev = new Set(initialSeverity);

  const applyParam = (key: string, val: string | null) => {
    const next = new URLSearchParams(sp);
    if (val) next.set(key, val);
    else next.delete(key);
    router.push(`/cves?${next.toString()}`);
  };

  const toggleSev = (s: Sev) => {
    const next = new Set(sev);
    next.has(s) ? next.delete(s) : next.add(s);
    applyParam("severity", next.size ? [...next].join(",") : null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyParam("q", q.trim() || null);
        }}
        className="flex items-center gap-2"
      >
        <Input
          placeholder="Search CVE id or title…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-8 w-[260px]"
        />
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyParam("cpe", cpe.trim() || null);
        }}
        className="flex items-center gap-2"
      >
        <Input
          placeholder="CPE contains (ubuntu, nginx…)"
          value={cpe}
          onChange={(e) => setCpe(e.target.value)}
          className="h-8 w-[220px] font-mono text-[12px]"
        />
      </form>

      <div className="ml-1 flex items-center gap-1">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {SEV.map((s) => {
          const active = sev.has(s);
          return (
            <button
              key={s}
              onClick={() => toggleSev(s)}
              className={cn(
                "rounded-md border px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors",
                active
                  ? "border-accent/40 bg-accent/10 text-[hsl(var(--accent))]"
                  : "border-border bg-background/30 text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {(initialQ || initialCpe || initialSeverity.length > 0) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/cves")}
        >
          <X /> Clear
        </Button>
      )}
    </div>
  );
}

export function SyncButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const sync = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/cves/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lookback_days: 7 }),
      });
      const data = await r.json();
      if (!r.ok) {
        setMsg(`Failed · ${data.error?.slice(0, 80) ?? r.status}`);
      } else {
        setMsg(`Synced · ${data.fetched} CVE${data.fetched === 1 ? "" : "s"}`);
        router.refresh();
      }
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 5000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {msg && (
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
          {msg}
        </span>
      )}
      <Button variant="secondary" onClick={sync} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        {busy ? "Syncing…" : "Sync now"}
      </Button>
    </div>
  );
}
