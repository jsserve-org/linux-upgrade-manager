"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteInstanceButton({
  instanceId,
  hostname,
}: {
  instanceId: string;
  hostname: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const onDelete = async () => {
    if (
      !confirm(
        `Delete endpoint "${hostname}"?\n\nThis removes the instance and its full job history from the hub. The agent on the host will keep running but will no longer be authorized.`
      )
    )
      return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/instances/${instanceId}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        alert(`Delete failed: ${r.status}`);
        setBusy(false);
        return;
      }
      router.push("/instances");
      router.refresh();
    } catch (e) {
      alert(`Delete failed: ${e}`);
      setBusy(false);
    }
  };

  return (
    <Button variant="danger" onClick={onDelete} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
      {busy ? "Deleting…" : "Delete"}
    </Button>
  );
}
