"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Download,
  ShieldAlert,
  Terminal,
  PowerOff,
  MoreHorizontal,
  Box,
  Trash2,
} from "lucide-react";
import type { Instance } from "@/lib/schema";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { StatusDot } from "./status-dot";

const JOB_TYPES = [
  { value: "check_updates", label: "Check for updates", icon: RefreshCw },
  { value: "install_updates", label: "Install all updates", icon: Download },
  { value: "install_updates_security", label: "Security updates only", icon: ShieldAlert },
  { value: "install_package", label: "Install package…", icon: Box },
  { value: "run_command", label: "Run command…", icon: Terminal },
  { value: "reboot", label: "Reboot", icon: PowerOff },
] as const;

function timeAgo(ts: number | null): string {
  if (!ts) return "never";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function statusOf(i: Instance) {
  if (!i.lastSeen) return { s: "unknown" as const, label: "never seen" };
  const age = Date.now() - i.lastSeen;
  if (age < 90_000) return { s: "online" as const, label: "online" };
  if (age < 10 * 60_000) return { s: "stale" as const, label: "stale" };
  return { s: "offline" as const, label: "offline" };
}

export function EndpointTable({ instances }: { instances: Instance[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [filter, setFilter] = React.useState("");
  const [jobType, setJobType] = React.useState("check_updates");
  const [extra, setExtra] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return instances;
    return instances.filter(
      (i) =>
        i.hostname.toLowerCase().includes(q) ||
        i.osName?.toLowerCase().includes(q) ||
        i.pkgManager?.toLowerCase().includes(q)
    );
  }, [instances, filter]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((i) => i.id)));
  };
  const allChecked = filtered.length > 0 && selected.size === filtered.length;

  const dispatch = async (
    type: string,
    payload: Record<string, unknown>,
    instanceIds?: string[]
  ) => {
    const ids = instanceIds ?? [...selected];
    if (!ids.length) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instance_ids: ids, type, payload }),
      });
      if (!r.ok) {
        alert(`Failed: ${r.status} ${await r.text()}`);
      } else {
        setSelected(new Set());
        setExtra("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteInstances = async (ids: string[], names: string[]) => {
    if (!ids.length) return;
    const msg =
      ids.length === 1
        ? `Delete endpoint "${names[0]}"? Its job history will also be removed.`
        : `Delete ${ids.length} endpoints? Their job history will also be removed.`;
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/instances/${id}`, { method: "DELETE" })
        )
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed) alert(`${failed} of ${ids.length} deletes failed.`);
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    let type = jobType;
    let payload: Record<string, unknown> = {};
    if (jobType === "install_updates_security") {
      type = "install_updates";
      payload = { security_only: true };
    } else if (jobType === "install_package") {
      payload = { packages: extra.split(/[\s,]+/).filter(Boolean) };
    } else if (jobType === "run_command") {
      payload = { command: extra };
    }
    dispatch(type, payload);
  };

  const needsExtra = jobType === "install_package" || jobType === "run_command";

  return (
    <Card className="overflow-hidden p-0">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface/40 px-4 py-3">
        <Input
          placeholder="Filter by hostname, OS…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 max-w-xs"
        />
        <div className="flex-1" />

        {selected.size > 0 && (
          <>
            <div className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-2.5 py-1">
              <span className="tabular text-[12px] font-medium text-[hsl(var(--accent))]">
                {selected.size}
              </span>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                selected
              </span>
              <button
                onClick={() => setSelected(new Set())}
                className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                clear
              </button>
            </div>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="h-8 w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <t.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {needsExtra && (
              <Input
                placeholder={
                  jobType === "install_package"
                    ? "nginx, curl, …"
                    : "uname -a"
                }
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                className={cn(
                  "h-8 w-[240px]",
                  jobType === "run_command" && "font-mono"
                )}
              />
            )}
            <Button
              size="default"
              onClick={submit}
              disabled={busy || (needsExtra && !extra.trim())}
            >
              {busy ? "Dispatching…" : "Dispatch"}
            </Button>
            <Button
              variant="danger"
              size="default"
              disabled={busy}
              onClick={() => {
                const ids = [...selected];
                const names = filtered
                  .filter((i) => selected.has(i.id))
                  .map((i) => i.hostname);
                deleteInstances(ids, names);
              }}
              title="Delete selected endpoints"
            >
              <Trash2 />
              Delete
            </Button>
          </>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[44px] pl-4 pr-0">
              <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead>Hostname</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Operating system</TableHead>
            <TableHead>Pkg</TableHead>
            <TableHead className="text-right">Updates</TableHead>
            <TableHead className="text-right">Security</TableHead>
            <TableHead>Last seen</TableHead>
            <TableHead className="w-[40px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={9} className="py-16">
                <div className="grid place-items-center">
                  <div className="text-center">
                    <Server className="mx-auto h-6 w-6 text-muted-foreground/50" />
                    <div className="mt-3 text-[14px] font-medium">
                      {instances.length === 0
                        ? "No endpoints enrolled yet"
                        : "No matches"}
                    </div>
                    <div className="mt-1 text-[12px] text-muted-foreground">
                      {instances.length === 0 ? (
                        <>
                          Generate an enrollment token on{" "}
                          <Link href="/enroll" className="text-accent hover:underline">
                            Enrollment
                          </Link>{" "}
                          and run the agent on a Linux host.
                        </>
                      ) : (
                        "Try a different filter."
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
          {filtered.map((i) => {
            const st = statusOf(i);
            const checked = selected.has(i.id);
            return (
              <TableRow
                key={i.id}
                data-state={checked ? "selected" : undefined}
                className="group"
              >
                <TableCell className="pl-4 pr-0">
                  <Checkbox checked={checked} onCheckedChange={() => toggle(i.id)} />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/instances/${i.id}`}
                    className="font-mono text-[13px] font-medium text-foreground hover:text-[hsl(var(--accent))]"
                  >
                    {i.hostname}
                  </Link>
                  <div className="font-mono text-[10.5px] text-muted-foreground/70">
                    {i.id.slice(0, 8)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusDot status={st.s} />
                    <span className="text-[12px] capitalize">{st.label}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-[13px]">{i.osName ?? "—"}</div>
                  <div className="font-mono text-[10.5px] text-muted-foreground/80">
                    {i.osVersion ?? ""} · {i.kernel ?? ""}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[9.5px]">
                    {i.pkgManager ?? "?"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular font-mono text-[12.5px]">
                  {i.updatesAvailable > 0 ? (
                    <span className="text-[hsl(var(--warn))]">{i.updatesAvailable}</span>
                  ) : (
                    <span className="text-muted-foreground/60">0</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular font-mono text-[12.5px]">
                  {i.securityUpdates > 0 ? (
                    <span className="text-[hsl(var(--danger))]">{i.securityUpdates}</span>
                  ) : (
                    <span className="text-muted-foreground/60">0</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-[11.5px]">
                  {timeAgo(i.lastSeen)}
                </TableCell>
                <TableCell className="pr-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background/60 hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => dispatch("check_updates", {}, [i.id])}
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                        Check updates
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => dispatch("install_updates", {}, [i.id])}
                      >
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        Install all updates
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          dispatch("install_updates", { security_only: true }, [i.id])
                        }
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                        Security only
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm(`Reboot ${i.hostname}?`))
                            dispatch("reboot", {}, [i.id]);
                        }}
                        className="text-[hsl(var(--danger))] focus:text-[hsl(var(--danger))]"
                      >
                        <PowerOff className="h-3.5 w-3.5" />
                        Reboot
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteInstances([i.id], [i.hostname])}
                        className="text-[hsl(var(--danger))] focus:text-[hsl(var(--danger))]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete endpoint
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function Server({ className }: { className?: string }) {
  // small inline icon to avoid an extra import roundtrip
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="6" rx="1" />
      <rect x="3" y="14" width="18" height="6" rx="1" />
      <circle cx="7" cy="7" r="0.5" fill="currentColor" />
      <circle cx="7" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}
