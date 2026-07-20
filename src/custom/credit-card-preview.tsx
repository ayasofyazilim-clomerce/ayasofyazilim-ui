"use client";

import type { ReactNode } from "react";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  CardBrandIcon,
  getCardBrand,
  type CardBrand,
} from "../components/card-brand-icon";

const PLACEHOLDER_NUMBER = "•••• •••• •••• ••••";

function CardChip({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-6 w-7.5 shrink-0 rounded-sm bg-linear-to-br from-amber-200 via-yellow-400 to-amber-600 shadow-inner @xs:h-6 @xs:w-9",
        className
      )}
    >
      <div className="flex h-full flex-col justify-center gap-[3px] px-1.5">
        <div className="h-px w-full bg-amber-900/40" />
        <div className="h-px w-full bg-amber-900/40" />
        <div className="h-px w-full bg-amber-900/40" />
      </div>
    </div>
  );
}

/** Shared pill look for status/nickname chips rendered into `children` — kept
 * here so callers match this card's visual language instead of guessing. */

export interface CreditCardPreviewLabels {
  holderNameLabel?: string;
  expiryLabel?: string;
}

export interface CreditCardPreviewProps {
  /** Resolved brand; derived from `number` when omitted. */
  brand?: CardBrand;
  /** Formatted or masked card number, e.g. "4111 1111 1111 1111" or "411111******1111". */
  number?: string;
  holderName?: string;
  /** Pre-formatted display string, e.g. "MM/YY". */
  expiry?: string;
  /** Dims the whole card face — purely visual, no behavior implied. */
  isExpired?: boolean;
  labels?: CreditCardPreviewLabels;
  /** Rendered in the top-right cluster next to the chip — nickname pill,
   * default/expired indicators, delete action, etc. Fully composed by the
   * caller; this component only lays it out. */
  children?: ReactNode;
  className?: string;
}

/**
 * A stylised, physical-card-like preview — chip, formatted number, holder
 * name, expiry and brand logo on a dark gradient face. Purely presentational:
 * it has no notion of nicknames, defaults, or actions — callers compose that
 * via `children`.
 *
 * Sizes itself off its own rendered width (container queries), not the
 * viewport, since the same component shows up both large (add-card dialog)
 * and small (saved-cards list) — `className` controls the width via the
 * outer `@container` wrapper, everything inside scales off of that.
 */
export function CreditCardPreview({
  brand,
  number,
  holderName,
  expiry,
  isExpired,
  labels,
  children,
  className,
}: CreditCardPreviewProps) {
  const resolvedBrand = brand ?? getCardBrand(number ?? "");
  const displayNumber = number?.trim() ? number : PLACEHOLDER_NUMBER;

  return (
    <div className={cn("@container w-full", className)}>
      <div
        className={cn(
          "relative aspect-8560/5398 w-full overflow-hidden rounded-xl p-3 text-white shadow-lg @xs:rounded-2xl @xs:p-4 @sm:p-5",
          "bg-linear-to-br from-primary via-primary/70 to-primary",
          isExpired && "opacity-60 saturate-50"
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-1/2 -right-1/4 size-[140%] rounded-full bg-white/5 blur-2xl"
        />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <CardChip />
            <div className="flex flex-wrap items-center justify-end gap-1">
              {children}
            </div>
          </div>

          <p className="truncate font-mono text-sm tracking-widest text-white/90 @xs:text-base @sm:text-lg @sm:tracking-[0.15em]">
            {displayNumber}
          </p>

          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[7px] tracking-wide text-white/50 uppercase @xs:text-[8px] @sm:text-[9px]">
                {labels?.holderNameLabel ?? "Card holder"}
              </p>
              <p className="truncate text-xs font-medium tracking-wide uppercase @sm:text-sm">
                {holderName || "—"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[7px] tracking-wide text-white/50 uppercase @xs:text-[8px] @sm:text-[9px]">
                {labels?.expiryLabel ?? "Expires"}
              </p>
              <p className="font-mono text-xs @sm:text-sm">
                {expiry || "MM/YY"}
              </p>
            </div>
            <CardBrandIcon brand={resolvedBrand} className="size-7" />
          </div>
        </div>
      </div>
    </div>
  );
}
