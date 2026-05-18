import Link from "next/link";
import { Server, ActivitySquare, ArrowUpCircle, ShieldAlert, ChevronRight } from "lucide-react";
import { listInstances, fleetStats, listJobs } from "@/lib/queries";
import { Metric } from "@/components/app/metric";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarList, StackedBar, type BarItem } from "@/components/app/bar-list";
import { StatusDot } from "@/components/app/status-dot";
import { EndpointTable } from "@/components/app/endpoint-table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const OS_COLORS: Record<string, string> = {
  Ubuntu: "#E95420",
  Debian: "#A81D33",
  Fedora: "#3C6EB4",
  CentOS: "#932279",
  "Red Hat Enterprise Linux": "#EE0000",
  "Rocky Linux": "#10B981",
  AlmaLinux: "#0D597F",
  "Arch Linux": "#1793D1",
  "openSUSE Leap": "#73BA25",
  Linux: "#71717A",
  Unknown: "#71717A",
};

function timeAgo(ts: number | null): string {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function Page() {
  const [instances, stats, jobs] = await Promise.all([
    listInstances(),
    fleetStats(),
    listJobs(8),
  ]);

  // OS distribution
  const osCounts = new Map<string, number>();
  for (const i of instances) {
    const k = i.osName ?? "Unknown";
    osCounts.set(k, (osCounts.get(k) ?? 0) + 1);
  }
  const osItems: BarItem[] = [...osCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([os, n]) => ({ label: os, value: n, color: OS_COLORS[os] ?? "#71717A" }));

  // Patch compliance
  const compliant = instances.filter((i) => i.updatesAvailable === 0 && i.lastSeen).length;
  const pending = instances.filter((i) => i.updatesAvailable > 0 && i.securityUpdates === 0).length;
  const critical = instances.filter((i) => i.securityUpdates > 0).length;
  const unknown = instances.length - compliant - pending - critical;
  const patchItems: BarItem[] = [
    { label: "Up to date",     value: compliant, color: "hsl(152 64% 52%)" },
    { label: "Updates pending", value: pending,  color: "hsl(38 92% 58%)" },
    { label: "Security critical", value: critical, color: "hsl(0 75% 60%)" },
    { label: "Unknown",         value: unknown,  color: "hsl(240 5% 45%)" },
  ];

  return (
    <div className="mx-auto max-w-[1320px] space-y-8">
      {/* page header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Fleet · live
          </div>
          <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight">
            Overview
          </h1>
          <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
            Patch compliance and recent activity across all managed Linux endpoints.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <StatusDot status="online" />
            <span className="ml-1">{stats.online} of {stats.total} online</span>
          </Badge>
          <Badge variant="outline">last sync {timeAgo(Date.now() - 45_000)}</Badge>
        </div>
      </div>

      {/* metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Endpoints"
          value={stats.total}
          hint="total"
          icon={Server}
          tone="default"
        />
        <Metric
          label="Online"
          value={stats.online}
          hint={`${stats.total ? Math.round((stats.online / stats.total) * 100) : 0}% healthy`}
          icon={ActivitySquare}
          tone="accent"
        />
        <Metric
          label="Updates pending"
          value={stats.needUpdates}
          hint="across fleet"
          icon={ArrowUpCircle}
          tone="warn"
        />
        <Metric
          label="Security critical"
          value={stats.needSecurity}
          hint="requires action"
          icon={ShieldAlert}
          tone="danger"
        />
      </div>

      {/* compliance + os widgets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* compliance */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Patch compliance</CardTitle>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="tabular text-[22px] font-semibold tracking-tight">
                  {instances.length ? Math.round((compliant / instances.length) * 100) : 0}
                  <span className="ml-0.5 text-base text-muted-foreground">%</span>
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  {compliant} / {instances.length} compliant
                </span>
              </div>
            </div>
            <Link
              href="/instances"
              className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <StackedBar items={patchItems} />
            <BarList items={patchItems} total={instances.length || 1} />
          </CardContent>
        </Card>

        {/* OS dist */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>OS distribution</CardTitle>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="tabular text-[22px] font-semibold tracking-tight">
                  {osItems.length}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  distros
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {osItems.length === 0 ? (
              <EmptyState text="No endpoints yet" />
            ) : (
              <BarList items={osItems} total={instances.length} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* recent activity */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent activity</CardTitle>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Latest jobs dispatched across the fleet.
            </p>
          </div>
          <Link
            href="/jobs"
            className="flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          >
            All activity <ChevronRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <EmptyState text="No jobs dispatched yet" />
          ) : (
            <ul className="divide-y divide-border">
              {jobs.map((j) => (
                <li
                  key={j.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-background/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <JobStatusDot status={j.status} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[13px]">
                        <span className="font-mono uppercase tracking-wider text-[10.5px] text-muted-foreground">
                          {j.type.replace(/_/g, " ")}
                        </span>
                        <span className="text-muted-foreground/40">·</span>
                        <Link
                          href={`/instances/${j.instanceId}`}
                          className="truncate font-medium text-foreground hover:text-accent"
                        >
                          {j.hostname}
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {timeAgo(j.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* endpoints table */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              endpoints
            </div>
            <h2 className="mt-1 text-[18px] font-semibold tracking-tight">
              All managed hosts
            </h2>
          </div>
        </div>
        <EndpointTable instances={instances} />
      </div>
    </div>
  );
}

function JobStatusDot({ status }: { status: string }) {
  const s: any =
    status === "succeeded" ? "online" :
    status === "failed" ? "danger" :
    status === "running" ? "warn" :
    "unknown";
  return <StatusDot status={s} />;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid place-items-center px-4 py-12 text-center">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
        {text}
      </div>
    </div>
  );
}
