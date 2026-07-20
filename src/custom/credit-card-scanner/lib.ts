/**
 * Pure parsing / validation helpers for the credit-card scanner.
 *
 * These have no DOM or React dependency so they're unit-testable in isolation.
 * The scanner's OCR pass produces noisy text; this module turns that text into
 * a validated card number (Luhn-checked), a recognised brand, and — when
 * present — an expiry date. The Luhn check is the scanner's main guard against
 * false positives, playing the same role the `<` filler check plays for the MRZ
 * scanner: a random run of digits almost never passes it.
 */

// ── Card brands ───────────────────────────────────────────────────────────────

export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners"
  | "jcb"
  | "unionpay"
  | "maestro"
  | "unknown";

/**
 * Luhn (mod-10) checksum. Every real card number satisfies it, so it's a cheap,
 * high-signal filter against OCR noise. Rejects anything non-numeric.
 */
export function luhnCheck(digits: string): boolean {
  if (digits.length === 0 || !/^\d+$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/**
 * Identify the card brand from its issuer prefix (BIN) and length. Returns
 * "unknown" when nothing matches — the number may still be valid (it passed
 * Luhn), we just don't recognise the scheme. Order matters: narrower prefixes
 * (e.g. UnionPay 62, Discover 65) are checked before the broad Maestro range.
 */
export function detectBrand(number: string): CardBrand {
  const len = number.length;
  // Numeric prefix of the first `count` digits.
  const p = (count: number): number => Number(number.slice(0, count));

  if (/^4/.test(number) && (len === 13 || len === 16 || len === 19))
    return "visa";

  if (
    len === 16 &&
    ((p(2) >= 51 && p(2) <= 55) || (p(4) >= 2221 && p(4) <= 2720))
  )
    return "mastercard";

  if (len === 15 && (p(2) === 34 || p(2) === 37)) return "amex";

  if (
    len >= 14 &&
    len <= 19 &&
    (p(4) === 6011 ||
      (p(3) >= 644 && p(3) <= 649) ||
      p(2) === 65 ||
      (p(6) >= 622126 && p(6) <= 622925))
  )
    return "discover";

  if (len >= 16 && len <= 19 && p(4) >= 3528 && p(4) <= 3589) return "jcb";

  if (
    len >= 14 &&
    len <= 19 &&
    ((p(3) >= 300 && p(3) <= 305) ||
      p(3) === 309 ||
      p(2) === 36 ||
      p(2) === 38 ||
      p(2) === 39)
  )
    return "diners";

  if (len >= 16 && len <= 19 && p(2) === 62) return "unionpay";

  if (len >= 12 && len <= 19 && (p(2) === 50 || (p(2) >= 56 && p(2) <= 69)))
    return "maestro";

  return "unknown";
}

/** Human-readable brand name for display. */
export function brandLabel(brand: CardBrand): string {
  switch (brand) {
    case "visa":
      return "Visa";
    case "mastercard":
      return "Mastercard";
    case "amex":
      return "American Express";
    case "discover":
      return "Discover";
    case "diners":
      return "Diners Club";
    case "jcb":
      return "JCB";
    case "unionpay":
      return "UnionPay";
    case "maestro":
      return "Maestro";
    default:
      return "Card";
  }
}

// ── Number / expiry extraction ─────────────────────────────────────────────────

const MIN_PAN_LENGTH = 13;
const MAX_PAN_LENGTH = 19;

/**
 * Pull the first plausible card number out of raw OCR text. The PAN is printed
 * as a single line of 4-digit groups, so we first try each line on its own
 * (stripping non-digits); failing that we fall back to scanning every
 * 13–19-digit window across all digits in the text. A candidate must pass Luhn.
 * When several lines qualify, a recognised brand wins, then the longest number.
 */
export function extractCardNumber(text: string): string | null {
  const lineCandidates: string[] = [];
  for (const line of text.split(/[\r\n]+/)) {
    const digits = line.replace(/\D/g, "");
    if (
      digits.length >= MIN_PAN_LENGTH &&
      digits.length <= MAX_PAN_LENGTH &&
      luhnCheck(digits)
    ) {
      lineCandidates.push(digits);
    }
  }

  if (lineCandidates.length > 0) {
    lineCandidates.sort((a, b) => {
      const knownA = detectBrand(a) !== "unknown" ? 1 : 0;
      const knownB = detectBrand(b) !== "unknown" ? 1 : 0;
      if (knownA !== knownB) return knownB - knownA;
      return b.length - a.length;
    });
    return lineCandidates[0] ?? null;
  }

  // Fallback: the OCR collapsed everything onto one line. Slide a window over
  // all digits and accept the first Luhn-valid run that maps to a known brand
  // (the brand requirement keeps this stricter path from over-matching noise).
  const allDigits = text.replace(/\D/g, "");
  for (let len = MAX_PAN_LENGTH; len >= MIN_PAN_LENGTH; len--) {
    for (let i = 0; i + len <= allDigits.length; i++) {
      const sub = allDigits.slice(i, i + len);
      if (detectBrand(sub) !== "unknown" && luhnCheck(sub)) return sub;
    }
  }
  return null;
}

/**
 * Cheap, low-bar signal that OCR text plausibly contains a card number —
 * unlike `extractCardNumber`, this doesn't require Luhn validity or a
 * recognised brand, just a long-enough run of digits on one line (mirroring
 * `extractCardNumber`'s own per-line digit extraction, so spacing between
 * 4-digit groups doesn't fragment a genuine PAN into short runs).
 *
 * This is one of the corroboration paths that lets the scanner fire the
 * (paid, slower) backend-extraction fallback automatically: a partial digit
 * run — which embossed digits Tesseract can't fully resolve into a Luhn-valid
 * PAN often still yield — lets a weaker pixel-presence reading through. (The
 * scanner's primary trigger no longer needs it: a frame the presence probe
 * classifies as a card on edge coverage alone is enough, since those embossed
 * cards may produce no OCR digit run at all.)
 */
export function hasPlausibleDigitRun(text: string, minLength = 8): boolean {
  return text
    .split(/[\r\n]+/)
    .some((line) => line.replace(/\D/g, "").length >= minLength);
}

/**
 * Find an expiry date (MM/YY or MM/YYYY) in OCR text and normalise it to
 * "MM/YY". The month must be 01–12. Returns null when none is found. The
 * cardholder's PAN line won't match (no separator), so this targets the small
 * "valid thru" date printed below it.
 *
 * When several dates match, the chronologically latest wins: many cards print
 * a "member since" / "valid from" date alongside the expiry, and the expiry
 * is by definition the one furthest in the future.
 */
export function extractExpiry(text: string): string | null {
  const re = /(0[1-9]|1[0-2])\s*[/-]\s*(\d{4}|\d{2})/g;
  // Two-digit years are pivoted (00–49 → 20xx, 50–99 → 19xx) so a 1990s
  // "member since" never outranks a 2020s expiry.
  const ordinal = (month: string, year: string) => {
    const yy = Number(year);
    return (yy >= 50 ? 1900 + yy : 2000 + yy) * 12 + Number(month);
  };
  let best: { month: string; year: string } | null = null;
  for (let match = re.exec(text); match; match = re.exec(text)) {
    const month = match[1] ?? "";
    const rawYear = match[2] ?? "";
    const year = rawYear.length === 4 ? rawYear.slice(2) : rawYear;
    if (!best || ordinal(month, year) > ordinal(best.month, best.year)) {
      best = { month, year };
    }
  }
  return best ? `${best.month}/${best.year}` : null;
}

// ── Formatting ──────────────────────────────────────────────────────────────

/**
 * Group a digit string into the spacing its brand uses: 4-6-5 for Amex,
 * 4-6-4 for Diners Club, and 4-4-4-… for everything else.
 */
export function formatCardNumber(number: string, brand?: CardBrand): string {
  const resolved = brand ?? detectBrand(number);
  if (resolved === "amex") {
    return number.replace(/^(\d{4})(\d{6})(\d{1,5})$/, "$1 $2 $3");
  }
  if (resolved === "diners") {
    return number.replace(/^(\d{4})(\d{6})(\d{1,4})$/, "$1 $2 $3");
  }
  return number.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/**
 * Mask all but the first and last four digits — used for on-screen feedback and
 * debug logging so a full PAN is never rendered or written to the console.
 */
export function maskCardNumber(number: string): string {
  if (number.length <= 8) return number;
  const first = number.slice(0, 4);
  const last = number.slice(-4);
  const middle = "•".repeat(number.length - 8);
  return `${first} ${middle} ${last}`;
}

/** Structured result of parsing one OCR pass. `number` is null when no valid PAN was found. */
export interface ParsedCard {
  number: string | null;
  brand: CardBrand;
  expiry: string | null;
}

/** Parse a full OCR text blob into a structured (best-effort) card result. */
export function parseCardText(text: string): ParsedCard {
  const number = extractCardNumber(text);
  return {
    number,
    brand: number ? detectBrand(number) : "unknown",
    expiry: extractExpiry(text),
  };
}
