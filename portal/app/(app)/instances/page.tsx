import { listInstances, fleetStats } from "@/lib/queries";
import { EndpointTable } from "@/components/app/endpoint-table";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/app/status-dot";

export const dynamic = "force-dynamic";

export default async function InstancesPage() {
  const [instances, stats] = await Promise.all([listInstances(), fleetStats()]);

  return (
    <div className="mx-auto max-w-[1320px] space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            fleet · all hosts
          </div>
          <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight">Endpoints</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Every Linux host enrolled in this hub. Select rows to dispatch jobs in bulk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <StatusDot status="online" />
            <span className="ml-1">{stats.online} online</span>
          </Badge>
          <Badge variant="outline">{stats.total} total</Badge>
          {stats.needSecurity > 0 && (
            <Badge variant="danger">{stats.needSecurity} security</Badge>
          )}
        </div>
      </div>

      <EndpointTable instances={instances} />
    </div>
  );
}
