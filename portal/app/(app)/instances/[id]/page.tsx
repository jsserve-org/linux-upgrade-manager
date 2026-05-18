import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Cpu, ArrowUpCircle, Clock, Terminal as TerminalIcon } from "lucide-react";
import { getInstance, listJobsForInstance } from "@/lib/queries";
import type { Job, Instance } from "@/lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Metric } from "@/components/app/metric";
import { StatusDot } from "@/components/app/status-dot";
import { JobActions } from "./JobActions";
import { DeleteInstanceButton } from "./DeleteInstanceButton";
import { InstanceCves } from "@/components/app/instance-cves";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function fmt(ts: number | null) {
  return ts ? new Date(ts).toLocaleString() : "—";
}

function statusOf(inst: Instance) {
  if (!inst.lastSeen) return { s: "unknown" as const, label: "never seen" };
  const age = Date.now() - inst.lastSeen;
  if (age < 90_000) return { s: "online" as const, label: "online" };
  if (age < 10 * 60_000) return { s: "stale" as const, label: "stale" };
  return { s: "offline" as const, label: "offline" };
}

function jobStatusBadge(s: Job["status"]) {
  const map = {
    succeeded: { variant: "accent" as const, label: "succeeded" },
    failed:    { variant: "danger" as const, label: "failed" },
    running:   { variant: "warn"   as const, label: "running" },
    pending:   { variant: "outline" as const, label: "pending" },
  };
  const v = map[s] ?? map.pending;
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

export default async function InstancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const instance = await getInstance(id);
  if (!instance) notFound();
  const jobs = await listJobsForInstance(id);
  const st = statusOf(instance);

  return (
    <div className="mx-auto max-w-[1320px] space-y-8">
      {/* breadcrumb-ish header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          Endpoints <ChevronRight className="h-3 w-3" /> {instance.hostname}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-[28px] font-medium tracking-tight">
            {instance.hostname}
          </h1>
          <Badge variant={st.s === "online" ? "accent" : st.s === "offline" ? "danger" : "default"}>
            <StatusDot status={st.s} />
            <span className="ml-1">{st.label}</span>
          </Badge>
          <Badge variant="outline">{instance.pkgManager ?? "?"}</Badge>
          <Badge variant="outline">{instance.arch ?? "?"}</Badge>
          <div className="flex-1" />
          <span className="font-mono text-[10.5px] text-muted-foreground">
            id · {instance.id.slice(0, 12)}…
          </span>
          <DeleteInstanceButton
            instanceId={instance.id}
            hostname={instance.hostname}
          />
        </div>
      </div>

      {/* metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Updates pending"
          value={instance.updatesAvailable}
          hint="packages"
          icon={ArrowUpCircle}
          tone={instance.updatesAvailable > 0 ? "warn" : "default"}
        />
        <Metric
          label="Security updates"
          value={instance.securityUpdates}
          hint={instance.securityUpdates > 0 ? "critical" : "none"}
          icon={Cpu}
          tone={instance.securityUpdates > 0 ? "danger" : "default"}
        />
        <Metric
          label="Last seen"
          value={
            instance.lastSeen
              ? new Date(instance.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "—"
          }
          hint={instance.lastSeen ? new Date(instance.lastSeen).toLocaleDateString() : ""}
          icon={Clock}
          tone="default"
        />
        <Metric
          label="Jobs (last)"
          value={jobs.length}
          hint={jobs[0]?.status ?? "—"}
          icon={TerminalIcon}
          tone="default"
        />
      </div>

      {/* system info + actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-[13px]">
              <Row label="OS" value={`${instance.osName ?? "—"} ${instance.osVersion ?? ""}`} />
              <Row label="Kernel" value={instance.kernel ?? "—"} mono />
              <Row label="Arch"   value={instance.arch ?? "—"} mono />
              <Row label="Pkg"    value={instance.pkgManager ?? "—"} mono />
              <Row label="Enrolled" value={fmt(instance.enrolledAt)} />
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Actions</CardTitle>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Dispatch a job to this host. Output appears in job history below.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <JobActions instanceId={instance.id} />
          </CardContent>
        </Card>
      </div>

      {/* OS-matched CVEs */}
      <InstanceCves osName={instance.osName} />

      {/* job history */}
      <Card className="p-0">
        <CardHeader>
          <CardTitle>Job history</CardTitle>
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
            {jobs.length} total
          </span>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]">Exit</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Finished</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-[13px]">
                  No jobs yet.
                </TableCell>
              </TableRow>
            )}
            {jobs.map((j) => (
              <TableRow key={j.id}>
                <TableCell>
                  <span className="font-mono text-[12px] uppercase tracking-wider text-foreground">
                    {j.type.replace(/_/g, " ")}
                  </span>
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
                <TableCell>
                  {(j.stdout || j.stderr || Object.keys(j.payload ?? {}).length) ? (
                    <details className="group">
                      <summary className="cursor-pointer list-none font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                        view · output
                      </summary>
                      <div className="mt-2 space-y-2">
                        {j.payload && Object.keys(j.payload).length > 0 && (
                          <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] text-muted-foreground">
                            {JSON.stringify(j.payload, null, 2)}
                          </pre>
                        )}
                        {j.stdout && (
                          <pre className="max-h-72 overflow-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] text-foreground/90">
                            {j.stdout}
                          </pre>
                        )}
                        {j.stderr && (
                          <pre className="max-h-72 overflow-auto rounded-md border border-danger/30 bg-danger/5 p-3 font-mono text-[11px] text-[hsl(var(--danger))]/90">
                            {j.stderr}
                          </pre>
                        )}
                      </div>
                    </details>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className={mono ? "font-mono text-[12.5px]" : "text-[13px]"}>{value}</dd>
    </>
  );
}
