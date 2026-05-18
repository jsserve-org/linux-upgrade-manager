"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Download,
  ShieldAlert,
  PowerOff,
  Box,
  Terminal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUICK = [
  { id: "check_updates", label: "Check updates", icon: RefreshCw, variant: "secondary" as const, payload: {} },
  { id: "install_updates", label: "Install all updates", icon: Download, variant: "default" as const, payload: {} },
  { id: "install_updates_security", label: "Security only", icon: ShieldAlert, variant: "secondary" as const, payload: { security_only: true }, type: "install_updates" },
  { id: "reboot", label: "Reboot", icon: PowerOff, variant: "danger" as const, payload: {}, confirm: true },
];

export function JobActions({ instanceId }: { instanceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [cmd, setCmd] = React.useState("");
  const [pkgs, setPkgs] = React.useState("");

  const dispatch = async (
    type: string,
    payload: Record<string, unknown> = {},
    label = type
  ) => {
    setBusy(label);
    try {
      const r = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instance_ids: [instanceId], type, payload }),
      });
      if (!r.ok) alert(`Failed: ${r.status}`);
      else router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* quick actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => {
          const Icon = q.icon;
          const isBusy = busy === q.id;
          return (
            <Button
              key={q.id}
              variant={q.variant}
              disabled={!!busy}
              onClick={() => {
                if (q.confirm && !confirm("Are you sure?")) return;
                dispatch(q.type ?? q.id, q.payload, q.id);
              }}
            >
              {isBusy ? <Loader2 className="animate-spin" /> : <Icon />}
              {q.label}
            </Button>
          );
        })}
      </div>

      {/* inline forms */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <InlineCommand
          icon={Box}
          label="Install packages"
          placeholder="nginx, curl, htop"
          value={pkgs}
          onChange={setPkgs}
          disabled={!!busy}
          busy={busy === "pkg"}
          onSubmit={() =>
            dispatch(
              "install_package",
              { packages: pkgs.split(/[\s,]+/).filter(Boolean) },
              "pkg"
            ).then(() => setPkgs(""))
          }
        />
        <InlineCommand
          icon={Terminal}
          label="Run shell command"
          placeholder="uname -a"
          value={cmd}
          onChange={setCmd}
          disabled={!!busy}
          busy={busy === "cmd"}
          monospace
          onSubmit={() =>
            dispatch("run_command", { command: cmd }, "cmd").then(() => setCmd(""))
          }
        />
      </div>
    </div>
  );
}

function InlineCommand({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  disabled,
  busy,
  monospace,
}: {
  icon: typeof Terminal;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  busy: boolean;
  monospace?: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit();
      }}
      className="rounded-md border border-border bg-background/40 p-3"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={monospace ? "font-mono text-[12.5px]" : ""}
        />
        <Button type="submit" disabled={disabled || !value.trim()}>
          {busy ? <Loader2 className="animate-spin" /> : "Run"}
        </Button>
      </div>
    </form>
  );
}
