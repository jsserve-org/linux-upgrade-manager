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
  const timer = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    if (timer.current) window.clearTimeout(timer.current);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const selection = document.getSelection();
        const selectedRanges =
          selection && selection.rangeCount > 0
            ? Array.from({ length: selection.rangeCount }, (_, i) =>
                selection.getRangeAt(i)
              )
            : [];
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "0";
        textArea.style.top = "0";
        textArea.style.width = "1px";
        textArea.style.height = "1px";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, textArea.value.length);
        const ok = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (selection) {
          selection.removeAllRanges();
          selectedRanges.forEach((range) => selection.addRange(range));
        }
        if (!ok) throw new Error("Copy command was rejected");
      }
      setCopied(true);
      setFailed(false);
      timer.current = window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
      setFailed(true);
      timer.current = window.setTimeout(() => setFailed(false), 1800);
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
