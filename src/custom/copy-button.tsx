"use client";

import { Button, ButtonProps } from "@repo/ayasofyazilim-ui/components/button";
import { useCopyToClipboard } from "@repo/ayasofyazilim-ui/hooks/use-copy-to-clipboard";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { Check, Copy } from "lucide-react";
import React from "react";

export type CopyLabels = { copy?: string; copied?: string };

export type CopyButtonProps = Omit<ButtonProps, "onClick" | "onCopy" | "children"> & {
  value: string;
  labels?: CopyLabels;
  onCopy?: (ok: boolean) => void;
};

export function CopyButton({
  value,
  labels,
  onCopy,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();
  const label = copied
    ? (labels?.copied ?? "Copied")
    : (labels?.copy ?? "Copy");
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      {...props}
      aria-label={label}
      title={label}
      onClick={async () => {
        const ok = await copy(value);
        onCopy?.(ok);
      }}
    >
      {copied ? (
        <Check aria-hidden="true" className="size-4" />
      ) : (
        <Copy aria-hidden="true" className="size-4" />
      )}
    </Button>
  );
}

export type CopyableTextProps = {
  value: string;
  children?: React.ReactNode;
  labels?: CopyLabels;
  onCopy?: (ok: boolean) => void;
  className?: string;
  classNames?: { container?: string; text?: string; button?: string };
};

export function CopyableText({
  value,
  children,
  labels,
  onCopy,
  className,
  classNames,
}: CopyableTextProps) {
  return (
    <span
      className={cn(
        "bg-muted inline-flex max-w-full items-center gap-1 rounded-md border py-0.5 pl-2 pr-0.5",
        className,
        classNames?.container
      )}
    >
      <code className={cn("truncate font-mono text-xs", classNames?.text)}>
        {children ?? value}
      </code>
      <CopyButton
        value={value}
        labels={labels}
        onCopy={onCopy}
        size="icon"
        className={cn("size-6 shrink-0", classNames?.button)}
      />
    </span>
  );
}
