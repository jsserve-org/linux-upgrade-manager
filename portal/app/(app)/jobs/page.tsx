import Link from "next/link";
import { listJobs } from "@/lib/queries";
import type { Job } from "@/lib/schema";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function fmt(ts: number | null) {
  return ts ? new Date(ts).toLocaleString() : "—";
}

function jobStatusBadge(s: Job["status"]) {
  const map = {
    succeeded: { variant: "accent"  as const, label: "succeeded" },
    failed:    { variant: "danger"  as const, label: "failed" },
    running:   { variant: "warn"    as const, label: "running" },
    pending:   { variant: "outline" as const, label: "pending" },
  };
  const v = map[s] ?? map.pending;
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

export default async function JobsPage() {
  const jobs = await listJobs(300);
  const counts = {
    succeeded: jobs.filter(j => j.status === "succeeded").length,
    failed:    jobs.filter(j => j.status === "failed").length,
    running:   jobs.filter(j => j.status === "running").length,
    pending:   jobs.filter(j => j.status === "pending").length,
  };

  return (
    <div className="mx-auto max-w-[1320px] space-y-6">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          activity · all jobs
        </div>
        <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Every job dispatched to managed hosts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Succeeded" n={counts.succeeded} tone="accent" />
        <StatTile label="Running"   n={counts.running}   tone="warn" />
        <StatTile label="Failed"    n={counts.failed}    tone="danger" />
        <StatTile label="Pending"   n={counts.pending}   tone="muted" />
      </div>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Jobs · last {jobs.length}</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Host</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]">Exit</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Finished</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-16 text-center text-muted-foreground text-[13px]">
                  No jobs dispatched yet.
                </TableCell>
              </TableRow>
            )}
            {jobs.map((j) => (
              <TableRow key={j.id}>
                <TableCell>
                  <Link
                    href={`/instances/${j.instanceId}`}
                    className="font-mono text-[13px] font-medium hover:text-[hsl(var(--accent))]"
                  >
                    {j.hostname ?? j.instanceId.slice(0, 8)}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-[12px] uppercase tracking-wider">
                  {j.type.replace(/_/g, " ")}
                </TableCell>
                <TableCell>{jobStatusBadge(j.status)}</TableCell>
                <TableCell className="font-mono tabular text-[12px]">
                  {j.exitCode ?? "—"}
                </TableCell>
                <TableCell className="font-mono text-[11.5px] text-muted-foreground">
                  {fmt(j.createdAt)}
                </TableCell>
                <TableCell className="font-mono text-[11.5px] text-muted-foreground">
                  {fmt(j.finishedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  n,
  tone,
}: {
  label: string;
  n: number;
  tone: "accent" | "warn" | "danger" | "muted";
}) {
  const color = {
    accent: "text-[hsl(var(--accent))]",
    warn:   "text-[hsl(var(--warn))]",
    danger: "text-[hsl(var(--danger))]",
    muted:  "text-muted-foreground",
  }[tone];
  return (
    <div className="rounded-md border border-border bg-subtle/60 px-4 py-3">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className={`tabular mt-1.5 text-[24px] font-semibold ${color}`}>{n}</div>
    </div>
  );
}
