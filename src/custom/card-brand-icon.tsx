import * as React from "react";
import { CreditCard } from "lucide-react";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners"
  | "jcb"
  | "unknown";

export const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unknown: "",
};

/**
 * Detect the card brand from a (possibly formatted) card number using the
 * standard IIN/BIN prefix ranges. Returns "unknown" when no range matches.
 * Order matters - more specific prefixes are tested before broader ones.
 */
export function getCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, "");
  if (!digits) return "unknown";
  if (/^4/.test(digits)) return "visa";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(6011|64[4-9]|65|622)/.test(digits)) return "discover";
  if (/^35(2[89]|[3-8]\d)/.test(digits)) return "jcb";
  if (/^3(0[0-5]|[689])/.test(digits)) return "diners";
  if (/^(5[1-5]|2(22[1-9]|2[3-9]|[3-6]\d|7[01]|720))/.test(digits))
    return "mastercard";
  return "unknown";
}

export interface CardBrandIconProps
  extends Omit<React.SVGProps<SVGSVGElement>, "aria-label"> {
  /** The brand to render. When omitted, it is derived from `cardNumber`. */
  brand?: CardBrand;
  /** A (possibly formatted) card number to detect the brand from. */
  cardNumber?: string;
}

/**
 * Renders the payment-network logo for a card brand. Pass either a resolved
 * `brand` or a `cardNumber` to detect it from. Falls back to a generic card
 * glyph for unknown / undetected brands.
 */
export function CardBrandIcon({
  brand,
  cardNumber,
  className,
  ...props
}: CardBrandIconProps) {
  const resolved =
    brand ?? (cardNumber !== undefined ? getCardBrand(cardNumber) : "unknown");
  const label = CARD_BRAND_LABELS[resolved] || "Card";

  if (resolved === "unknown") {
    return (
      <CreditCard
        aria-label={label}
        className={cn("size-5 shrink-0 text-muted-foreground", className)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      className={cn("size-5 shrink-0", className)}
      {...props}
    >
      <title>{label}</title>
      {renderBrand(resolved)}
    </svg>
  );
}

function renderBrand(brand: Exclude<CardBrand, "unknown">): React.ReactNode {
  switch (brand) {
    case "visa":
      return (
        <>
          <rect x="1" y="4" width="22" height="16" rx="2.5" fill="#1434CB" />
          <text
            x="12"
            y="15.4"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="7"
            fontStyle="italic"
            fontWeight="700"
            letterSpacing="0.4"
            fill="#fff"
          >
            VISA
          </text>
        </>
      );
    case "mastercard":
      return (
        <>
          <rect
            x="1"
            y="4"
            width="22"
            height="16"
            rx="2.5"
            fill="#fff"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
          <circle cx="10" cy="12" r="4.4" fill="#EB001B" />
          <circle cx="14" cy="12" r="4.4" fill="#F79E1B" />
          <path
            d="M12 8.4a4.4 4.4 0 0 1 0 7.2 4.4 4.4 0 0 1 0-7.2Z"
            fill="#FF5F00"
          />
        </>
      );
    case "amex":
      return (
        <>
          <rect x="1" y="4" width="22" height="16" rx="2.5" fill="#2E77BC" />
          <text
            x="12"
            y="14.7"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="5.2"
            fontWeight="700"
            letterSpacing="0.2"
            fill="#fff"
          >
            AMEX
          </text>
        </>
      );
    case "discover":
      return (
        <>
          <rect
            x="1"
            y="4"
            width="22"
            height="16"
            rx="2.5"
            fill="#fff"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
          <text
            x="3.4"
            y="14.4"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="4.1"
            fontWeight="700"
            letterSpacing="-0.1"
            fill="#1A1A1A"
          >
            DISC
          </text>
          <circle cx="18.2" cy="14.6" r="3" fill="#FF6000" />
        </>
      );
    case "diners":
      return (
        <>
          <rect x="1" y="4" width="22" height="16" rx="2.5" fill="#0079BE" />
          <circle cx="12" cy="12" r="4.6" fill="#fff" />
          <rect x="11.35" y="7.4" width="1.3" height="9.2" fill="#0079BE" />
        </>
      );
    case "jcb":
      return (
        <>
          <rect
            x="1"
            y="4"
            width="22"
            height="16"
            rx="2.5"
            fill="#fff"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
          {(
            [
              ["#0B4EA2", 4.8, "J"],
              ["#B3122B", 9.9, "C"],
              ["#1C8B3B", 15.0, "B"],
            ] as const
          ).map(([color, x, letter]) => (
            <React.Fragment key={letter}>
              <rect
                x={x}
                y="6.8"
                width="4.2"
                height="10.4"
                rx="1"
                fill={color}
              />
              <text
                x={x + 2.1}
                y="13.6"
                textAnchor="middle"
                fontFamily="Arial, Helvetica, sans-serif"
                fontSize="3.6"
                fontWeight="700"
                fill="#fff"
              >
                {letter}
              </text>
            </React.Fragment>
          ))}
        </>
      );
  }
}
