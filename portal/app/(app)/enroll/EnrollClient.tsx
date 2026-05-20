"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, KeyRound, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/app/copy-button";

export function EnrollClient({ hubUrl }: { hubUrl: string }) {
  const router = useRouter();
  const [token, setToken] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/enroll-tokens", { method: "POST" });
      const data = await r.json();
      setToken(data.token);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const command = token
    ? `curl -fsSL ${hubUrl}/install.sh | sudo env HUB_URL=${hubUrl} ENROLL_TOKEN=${token} bash`
    : null;

  return (
    <div className="space-y-3">
      {token ? (
        <>
          <div className="rounded-md border border-accent/30 bg-accent/5 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[hsl(var(--accent))]">
                fresh token
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border border-border bg-background/60 px-3 py-1.5 font-mono text-[12.5px]">
                {token}
              </code>
              <CopyButton value={token} />
            </div>
          </div>

          <div className="rounded-md border border-border bg-background/40 p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                run on host · ready to paste
              </span>
              <div className="flex-1" />
              <CopyButton value={command!} label="Copy command" />
            </div>
            <pre className="overflow-x-auto rounded-md border border-border bg-background/80 p-3 font-mono text-[11.5px] leading-relaxed text-foreground/90">
              <span className="text-muted-foreground/70">$ </span>
              <span className="break-all">{command}</span>
            </pre>
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              The agent auto-detects arch (x86_64 / aarch64), downloads the binary from
              this hub, installs a systemd unit, and starts polling.
            </p>
          </div>
        </>
      ) : (
        <div className="rounded-md border border-dashed border-border bg-background/30 px-4 py-6 text-center">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            no active token
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground/80">
            Click below to mint one — you'll get the full install command ready to paste.
          </p>
        </div>
      )}
      <Button onClick={create} disabled={busy} className="w-full">
        {busy ? <Loader2 className="animate-spin" /> : <Plus />}
        {busy ? "Generating…" : "Generate enrollment token"}
      </Button>
    </div>
  );
}
