"use client";

import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { cva } from "class-variance-authority";
import { Star } from "lucide-react";
import React from "react";

export type StarRatingLabels = {
  rating?: (value: number, max: number) => string;
  star?: (n: number, max: number) => string;
};

export type StarRatingProps = {
  value: number;
  max?: number;
  onValueChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  labels?: StarRatingLabels;
  className?: string;
};

const starVariants = cva("shrink-0", {
  variants: {
    size: { sm: "size-4", md: "size-5", lg: "size-6" },
  },
  defaultVariants: { size: "md" },
});

const defaultRating = (v: number, m: number) => `${v} of ${m}`;
const defaultStar = (n: number, m: number) => `${n} of ${m}`;

function clampValue(value: number, max: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), max);
}

function StarGlyph({
  fill,
  size,
}: {
  fill: number;
  size: "sm" | "md" | "lg";
}) {
  const pct = Math.min(Math.max(fill, 0), 1) * 100;
  return (
    <span
      className="relative inline-flex"
      aria-hidden="true"
      data-filled={fill >= 1 ? "true" : "false"}
    >
      <Star
        aria-hidden="true"
        className={cn(starVariants({ size }), "text-muted-foreground")}
      />
      {pct > 0 && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          <Star
            aria-hidden="true"
            className={cn(starVariants({ size }), "fill-current text-amber-500")}
          />
        </span>
      )}
    </span>
  );
}

export function StarRating({
  value,
  max = 5,
  onValueChange,
  size = "md",
  disabled = false,
  labels,
  className,
}: StarRatingProps) {
  const rating = labels?.rating ?? defaultRating;
  const starLabel = labels?.star ?? defaultStar;
  const clamped = clampValue(value, max);
  const [hover, setHover] = React.useState<number | null>(null);
  const radioRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const stars = Array.from({ length: Math.max(0, Math.floor(max)) }, (_, i) => i + 1);

  if (!onValueChange) {
    return (
      <span
        role="img"
        aria-label={rating(clamped, max)}
        className={cn("inline-flex items-center gap-0.5", className)}
      >
        {stars.map((n) => (
          <StarGlyph
            key={n}
            size={size}
            fill={Math.min(Math.max(clamped - (n - 1), 0), 1)}
          />
        ))}
      </span>
    );
  }

  const selected = Math.round(clamped);
  const shown = hover ?? clamped;
  const tabStop = selected >= 1 ? selected : 1;

  const select = (n: number, focus: boolean) => {
    const next = Math.min(Math.max(n, 1), stars.length);
    if (focus) radioRefs.current[next - 1]?.focus();
    if (next !== selected) onValueChange(next);
  };

  const onKeyDown = (e: React.KeyboardEvent, n: number) => {
    if (disabled) return;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = n + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = n - 1;
    else if (e.key === "Home") next = 1;
    else if (e.key === "End") next = stars.length;
    if (next === null) return;
    e.preventDefault();
    select(next, true);
  };

  return (
    <div
      role="radiogroup"
      aria-label={rating(clamped, max)}
      aria-disabled={disabled || undefined}
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => setHover(null)}
    >
      {stars.map((n) => (
        <button
          key={n}
          ref={(el) => {
            radioRefs.current[n - 1] = el;
          }}
          type="button"
          role="radio"
          aria-checked={n === selected}
          aria-label={starLabel(n, max)}
          disabled={disabled}
          tabIndex={n === tabStop ? 0 : -1}
          className="rounded-sm outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => select(n, false)}
          onMouseEnter={() => !disabled && setHover(n)}
          onKeyDown={(e) => onKeyDown(e, n)}
        >
          <StarGlyph size={size} fill={Math.min(Math.max(shown - (n - 1), 0), 1)} />
        </button>
      ))}
    </div>
  );
}
