"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/app/copy-button";

export function TokenRow({
  token,
  createdAt,
}: {
  token: string;
  createdAt: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const onDelete = async () => {
    if (!confirm(`Revoke token ${token.slice(0, 8)}…? Any host trying to enroll with it will be rejected.`))
      return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/enroll-tokens/${token}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        alert(`Failed: ${r.status}`);
        setBusy(false);
        return;
      }
      router.refresh();
    } catch (e) {
      alert(`Failed: ${e}`);
      setBusy(false);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-mono text-[12.5px]">{token}</TableCell>
      <TableCell className="font-mono text-[11.5px] text-muted-foreground">
        {new Date(createdAt).toLocaleString()}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <CopyButton value={token} label="" />
          <Button
            variant="danger"
            size="icon"
            onClick={onDelete}
            disabled={busy}
            title="Revoke token"
          >
            {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
