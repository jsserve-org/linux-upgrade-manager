import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ExternalLink, ShieldAlert } from "lucide-react";
import { getCve } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/app/severity-badge";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cve = await getCve(id);
  if (!cve) notFound();

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div>
        <Link
          href="/cves"
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          CVE feed <ChevronRight className="h-3 w-3" /> {cve.id}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-[26px] font-medium tracking-tight">
            {cve.id}
          </h1>
          <SeverityBadge severity={cve.severity} score={cve.cvssScore} />
          {cve.cwes.slice(0, 4).map((w) => (
            <Badge key={w} variant="outline">{w}</Badge>
          ))}
          <div className="flex-1" />
          <a
            href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          >
            View on NVD <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[14px] leading-relaxed text-foreground/90">
              {cve.description}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CVSS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular text-[36px] font-semibold leading-none tracking-tight">
              {cve.cvssScore != null ? (cve.cvssScore / 10).toFixed(1) : "—"}
            </div>
            <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              {cve.severity}
            </div>
            {cve.cvssVector && (
              <div className="mt-3 overflow-hidden rounded-md border border-border bg-background/40 p-2">
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  vector
                </div>
                <div className="mt-1 break-all font-mono text-[11px]">
                  {cve.cvssVector}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affected products · {cve.cpes.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {cve.cpes.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              No CPE bindings published.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-1 md:grid-cols-2">
              {cve.cpes.slice(0, 80).map((c) => (
                <li
                  key={c}
                  className="overflow-hidden truncate rounded border border-border bg-background/40 px-2 py-1 font-mono text-[11px] text-foreground/85"
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {cve.refs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {cve.refs.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-background/40"
              >
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground group-hover:text-[hsl(var(--accent))]" />
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] text-foreground/90 group-hover:text-[hsl(var(--accent))]">
                    {r.url}
                  </div>
                  {r.tags && r.tags.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {r.tags.map((t) => (
                        <span
                          key={t}
                          className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
