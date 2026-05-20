"use client";
import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function CopyButton({
  value,
  className,
  label = "Copy",
}: {
  value: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!ok) throw new Error("Copy command was rejected");
      }
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
      setFailed(true);
      window.setTimeout(() => setFailed(false), 1800);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={cn("font-mono text-[10.5px] uppercase tracking-wider", className)}
      onClick={copy}
    >
      {copied ? <Check className="text-[hsl(var(--accent))]" /> : <Copy />}
      {copied ? "Copied" : failed ? "Failed" : label}
    </Button>
  );
}
