import { headers } from "next/headers";
import { listEnrollTokens } from "@/lib/queries";
import { EnrollClient } from "./EnrollClient";
import { TokenRow } from "./TokenRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CopyButton } from "@/components/app/copy-button";
import { KeyRound, Download, ArrowRight, Cpu } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EnrollPage() {
  const tokens = await listEnrollTokens();
  const h = await headers();
  const host = h.get("host") ?? "your-hub:3001";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const hubUrl = `${proto}://${host}`;

  const oneLiner = `curl -fsSL ${hubUrl}/install.sh | sudo env HUB_URL=${hubUrl} ENROLL_TOKEN=<token> bash`;

  return (
    <div className="mx-auto max-w-[1100px] space-y-8">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          enrollment · provisioning
        </div>
        <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight">
          Enroll an endpoint
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
          Generate an enrollment token, then run the one-liner on any Linux host.
          The agent is a prebuilt binary — no Bun, Node, or other runtime
          required on the target.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Step number="01" title="Generate token" icon={KeyRound}>
          <p className="mb-4 text-[13px] text-muted-foreground">
            Mint an enrollment token. After it's generated, the complete install
            command for this hub will appear with the token already filled in.
          </p>
          <EnrollClient hubUrl={hubUrl} />
        </Step>

        <Step number="02" title="Run on host" icon={Cpu}>
          <p className="mb-3 text-[13px] text-muted-foreground">
            Auto-detects arch, downloads the binary from this hub, installs a
            systemd unit, and starts it.
          </p>
          <div className="relative">
            <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 pr-20 font-mono text-[11.5px] leading-relaxed text-foreground/90">
              <span className="text-muted-foreground/70">$ </span>
              {oneLiner}
            </pre>
            <div className="absolute right-2 top-2">
              <CopyButton value={oneLiner} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <DownloadTile
              label="lum-agent · x86_64"
              href={`${hubUrl}/api/install/agent/x64`}
            />
            <DownloadTile
              label="lum-agent · aarch64"
              href={`${hubUrl}/api/install/agent/arm64`}
            />
          </div>
        </Step>
      </div>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Existing tokens</CardTitle>
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
            {tokens.length} total
          </span>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Token</TableHead>
              <TableHead className="w-[200px]">Created</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-12 text-center text-muted-foreground text-[13px]">
                  No tokens yet. Generate one above.
                </TableCell>
              </TableRow>
            )}
            {tokens.map((t) => (
              <TokenRow key={t.token} token={t.token} createdAt={t.createdAt} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Step({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  icon: typeof KeyRound;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-md border border-accent/30 bg-accent/10 text-[hsl(var(--accent))]">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              step {number}
            </div>
            <CardTitle className="!normal-case !tracking-normal !text-[14px] !text-foreground">
              {title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DownloadTile({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2 transition-colors hover:border-accent/40 hover:bg-accent/5"
    >
      <div className="flex items-center gap-2">
        <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[hsl(var(--accent))]" />
        <span className="font-mono text-[11.5px]">{label}</span>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[hsl(var(--accent))]" />
    </a>
  );
}
