import Link from "next/link";
import { Shield, ShieldCheck, ArrowRight } from "lucide-react";
import { listAffectedCves } from "@/lib/queries";
import type { Instance } from "@/lib/schema";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/app/severity-badge";

export async function InstanceCves({
  instance,
  className,
}: {
  instance: Instance;
  className?: string;
}) {
  const cves = (await listAffectedCves({
    sinceMs: Date.now() - 30 * 86_400_000,
    severity: ["CRITICAL", "HIGH"],
    limit: 100,
  }))
    .filter((c) => c.affected.some((a) => a.instanceId === instance.id))
    .slice(0, 8);

  return (
    <Card className={`p-0 ${className ?? ""}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-[hsl(var(--warn))]" />
          <CardTitle>Recent affected CVEs</CardTitle>
        </div>
        <Link
          href="/cves?severity=CRITICAL,HIGH"
          className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      {cves.length === 0 ? (
        <div className="grid place-items-center px-4 py-8 text-center">
          <ShieldCheck className="h-5 w-5 text-[hsl(var(--accent))]/70" />
          <div className="mt-2 text-[13px] font-medium">All clear (last 30d)</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            No critical or high CVEs currently match this host inventory.
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {cves.map((c) => (
            <li key={c.id}>
              <Link
                href={`/cves/${c.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-background/40"
              >
                <SeverityBadge severity={c.severity} score={c.cvssScore} />
                <span className="font-mono text-[12px] text-muted-foreground">
                  {c.id}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground/90">
                  {c.title}
                </span>
                <span className="hidden max-w-[220px] truncate font-mono text-[10px] text-muted-foreground/80 md:inline">
                  {c.affected
                    .find((a) => a.instanceId === instance.id)
                    ?.reasons.slice(0, 2)
                    .join(" · ")}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground/80">
                  {new Date(c.publishedAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
