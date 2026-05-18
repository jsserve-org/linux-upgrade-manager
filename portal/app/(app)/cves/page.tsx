import Link from "next/link";
import { listCves, cveSeverityCounts, lastCveSync } from "@/lib/queries";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/app/severity-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldAlert, ShieldCheck, Activity } from "lucide-react";
import { CveFilters, SyncButton } from "./CveControls";

export const dynamic = "force-dynamic";

function ago(ts: number | null): string {
  if (!ts) return "never";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function CvesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; severity?: string; cpe?: string }>;
}) {
  const sp = await searchParams;
  const sev = sp.severity ? (sp.severity.split(",") as any) : undefined;

  const [cves, counts7d, lastSync] = await Promise.all([
    listCves({
      q: sp.q,
      severity: sev,
      cpeContains: sp.cpe,
      limit: 250,
    }),
    cveSeverityCounts(Date.now() - 7 * 86_400_000),
    lastCveSync(),
  ]);

  return (
    <div className="mx-auto max-w-[1320px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            vulnerability intel · nvd
          </div>
          <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight">
            CVE feed
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Published & recently-modified CVEs from the National Vulnerability
            Database. Last sync {ago(lastSync)}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Activity className="h-3 w-3" />
            <span className="ml-1">{cves.length} loaded</span>
          </Badge>
          <SyncButton />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SevTile label="Critical · 7d" n={counts7d.CRITICAL} severity="CRITICAL" />
        <SevTile label="High · 7d"     n={counts7d.HIGH}     severity="HIGH" />
        <SevTile label="Medium · 7d"   n={counts7d.MEDIUM}   severity="MEDIUM" />
        <SevTile label="Low · 7d"      n={counts7d.LOW}      severity="LOW" />
      </div>

      <Card className="p-0">
        <div className="border-b border-border bg-surface/40 px-4 py-3">
          <CveFilters
            initialQ={sp.q ?? ""}
            initialSeverity={sev ?? []}
            initialCpe={sp.cpe ?? ""}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[140px]">CVE</TableHead>
              <TableHead className="w-[120px]">Severity</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[140px]">Published</TableHead>
              <TableHead className="w-[110px]">Affected</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cves.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-16">
                  <div className="grid place-items-center text-center">
                    <ShieldCheck className="mx-auto h-6 w-6 text-muted-foreground/50" />
                    <div className="mt-3 text-[14px] font-medium">No CVEs match</div>
                    <div className="mt-1 text-[12px] text-muted-foreground">
                      {lastSync
                        ? "Try clearing filters or running a sync."
                        : "No data yet. Click ‘Sync now’ to fetch from NVD."}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {cves.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link
                    href={`/cves/${c.id}`}
                    className="font-mono text-[12.5px] font-medium hover:text-[hsl(var(--accent))]"
                  >
                    {c.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={c.severity} score={c.cvssScore} />
                </TableCell>
                <TableCell className="max-w-[600px]">
                  <div className="truncate text-[13px] text-foreground/90">
                    {c.title}
                  </div>
                  {c.cwes.length > 0 && (
                    <div className="mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground/80">
                      {c.cwes.slice(0, 3).join(" · ")}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-[11.5px] text-muted-foreground">
                  {new Date(c.publishedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-mono text-[11.5px] text-muted-foreground">
                  {c.cpes.length > 0 ? `${c.cpes.length} cpe${c.cpes.length === 1 ? "" : "s"}` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function SevTile({
  label,
  n,
  severity,
}: {
  label: string;
  n: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}) {
  const tone = {
    CRITICAL: "text-[hsl(var(--danger))]",
    HIGH:     "text-[hsl(var(--danger))]",
    MEDIUM:   "text-[hsl(var(--warn))]",
    LOW:      "text-[hsl(var(--accent))]",
  }[severity];
  return (
    <Link
      href={`/cves?severity=${severity}`}
      className="group rounded-md border border-border bg-subtle/60 px-4 py-3 transition-colors hover:border-border-strong"
    >
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
        <ShieldAlert className={`h-3.5 w-3.5 ${tone}`} />
      </div>
      <div className={`tabular mt-1.5 text-[24px] font-semibold ${tone}`}>{n}</div>
    </Link>
  );
}
