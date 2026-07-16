"use client";

import * as React from "react";
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

export interface CreditCardPreviewLabels {
  holderNameLabel?: string;
  expiryLabel?: string;
  default?: string;
  expired?: string;
}

export interface CreditCardPreviewProps {
  /** Resolved brand; derived from `number` when omitted. */
  brand?: CardBrand;
  /** Formatted or masked card number, e.g. "4111 1111 1111 1111" or "411111******1111". */
  number?: string;
  holderName?: string;
  /** Pre-formatted display string, e.g. "MM/YY". */
  expiry?: string;
  nickname?: string;
  isDefault?: boolean;
  isExpired?: boolean;
  labels?: CreditCardPreviewLabels;
  /** Rendered top-left, next to the chip — typically a small actions-menu trigger. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * A stylised, physical-card-like preview — chip, formatted number, holder
 * name, expiry and brand logo on a dark gradient face. Used both as a live
 * preview while entering a new card and to display already-saved cards.
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
  nickname,
  isDefault,
  isExpired,
  labels,
  actions,
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
            <div className="flex items-center gap-1.5">
              {actions}
              <CardChip />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1">
              {nickname ? (
                <span className="max-w-24 truncate rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-medium backdrop-blur @xs:max-w-32 @xs:px-2 @xs:text-[10px]">
                  {nickname}
                </span>
              ) : null}
              {isDefault ? (
                <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase backdrop-blur @xs:px-2 @xs:text-[10px]">
                  {labels?.default ?? "Default"}
                </span>
              ) : null}
              {isExpired ? (
                <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-red-200 uppercase backdrop-blur @xs:px-2 @xs:text-[10px]">
                  {labels?.expired ?? "Expired"}
                </span>
              ) : null}
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
            <CardBrandIcon
              brand={resolvedBrand}
              className="size-6 shrink-0 rounded-sm shadow @sm:size-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
