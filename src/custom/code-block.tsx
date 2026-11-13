"use client";

import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { CopyButton } from "./copy-button";

const MASK = "••••••••••••";

export type CodeBlockProps = {
  code: string;
  language?: string;
  masked?: boolean;
  labels?: { copy?: string; copied?: string; reveal?: string; hide?: string };
  onCopy?: (ok: boolean) => void;
  maxHeight?: number | string;
  className?: string;
  classNames?: { container?: string; toolbar?: string; pre?: string };
};

export function CodeBlock({
  code,
  language,
  masked = false,
  labels,
  onCopy,
  maxHeight,
  className,
  classNames,
}: CodeBlockProps) {
  // Derived from the code it was revealed for, so a new secret starts masked.
  const [revealedFor, setRevealedFor] = useState<string | null>(null);
  const revealed = revealedFor === code;
  const hidden = masked && !revealed;
  const toggleLabel = revealed
    ? (labels?.hide ?? "Hide")
    : (labels?.reveal ?? "Reveal");
  return (
    <div
      className={cn(
        "bg-muted relative rounded-md border",
        className,
        classNames?.container
      )}
    >
      <div
        className={cn(
          "absolute right-1 top-1 flex items-center gap-0.5",
          classNames?.toolbar
        )}
      >
        {masked && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label={toggleLabel}
            title={toggleLabel}
            onClick={() => setRevealedFor(revealed ? null : code)}
          >
            {revealed ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </Button>
        )}
        <CopyButton
          value={code}
          labels={labels}
          onCopy={onCopy}
          className="size-6"
        />
      </div>
      <pre
        data-language={language}
        tabIndex={maxHeight === undefined ? undefined : 0}
        className={cn(
          "overflow-auto p-3 pr-16 font-mono text-xs",
          classNames?.pre
        )}
        style={maxHeight === undefined ? undefined : { maxHeight }}
      >
        <code>{hidden ? MASK : code}</code>
      </pre>
    </div>
  );
}
