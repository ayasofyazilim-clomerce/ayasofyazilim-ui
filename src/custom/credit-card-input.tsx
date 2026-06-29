"use client";

import * as React from "react";
import { User } from "lucide-react";

import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  CardBrandIcon,
  getCardBrand,
  type CardBrand,
} from "../components/card-brand-icon";
import { Field, FieldError, FieldGroup, FieldLabel } from "../components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../components/input-group";

// ---------------------------------------------------------------------------
// Value + formatting helpers (exported so callers can format injected data,
// e.g. when autofilling from an NFC tag or a saved profile).
// ---------------------------------------------------------------------------
export interface CreditCardValue {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

export const emptyCreditCardValue: CreditCardValue = {
  number: "",
  expiry: "",
  cvc: "",
  name: "",
};

// Per-brand grouping, max length and CVC length.
const BRAND_FORMAT: Record<
  CardBrand,
  { gaps: number[]; maxDigits: number; cvcLength: number }
> = {
  visa: { gaps: [4, 8, 12], maxDigits: 16, cvcLength: 3 },
  mastercard: { gaps: [4, 8, 12], maxDigits: 16, cvcLength: 3 },
  amex: { gaps: [4, 10], maxDigits: 15, cvcLength: 4 },
  discover: { gaps: [4, 8, 12], maxDigits: 16, cvcLength: 3 },
  diners: { gaps: [4, 10], maxDigits: 14, cvcLength: 3 },
  jcb: { gaps: [4, 8, 12], maxDigits: 16, cvcLength: 3 },
  unknown: { gaps: [4, 8, 12], maxDigits: 19, cvcLength: 4 },
};

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatWithGaps(digits: string, gaps: number[]): string {
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i !== 0 && gaps.includes(i)) out += " ";
    out += digits[i] ?? "";
  }
  return out;
}

/** Group a (raw or formatted) card number per the detected brand. */
export function formatCardNumber(raw: string): string {
  const digits = onlyDigits(raw);
  const { gaps, maxDigits } = BRAND_FORMAT[getCardBrand(digits)];
  return formatWithGaps(digits.slice(0, maxDigits), gaps);
}

/** Normalise MMYY, MM/YY, MM/YYYY, YYYY-MM, MM-YY → "MM/YY". */
export function normalizeExpiry(raw: string): string {
  const trimmed = raw.trim();
  const isoMatch = /^(\d{4})[-/](\d{1,2})$/.exec(trimmed); // YYYY-MM
  if (isoMatch) {
    const isoYear = isoMatch[1] ?? "";
    const isoMonth = isoMatch[2] ?? "";
    return `${isoMonth.padStart(2, "0")}/${isoYear.slice(2)}`;
  }
  const digits = onlyDigits(trimmed);
  if (digits.length === 0) return "";
  const month = digits.slice(0, 2);
  const year = digits.slice(2, 6);
  const shortYear = year.length === 4 ? year.slice(2) : year;
  return shortYear ? `${month}/${shortYear}` : month;
}

/** Trim a CVC to the brand's expected length. */
export function formatCvc(raw: string, brand: CardBrand): string {
  return onlyDigits(raw).slice(0, BRAND_FORMAT[brand].cvcLength);
}

/** Luhn checksum — false for inputs shorter than 12 digits. */
export function luhnValid(cardNumber: string): boolean {
  const digits = onlyDigits(cardNumber);
  if (digits.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type CardField = "number" | "expiry" | "cvc" | "name";

interface FieldText {
  label?: string;
  placeholder?: string;
}

export interface CreditCardInputMessages {
  /** Label for the merged number/expiry/cvc row. */
  cardDetailsLabel?: string;
  number?: FieldText;
  expiry?: FieldText;
  cvc?: FieldText;
  name?: FieldText;
  invalidNumber?: string;
}

const DEFAULT_MESSAGES: Required<CreditCardInputMessages> = {
  cardDetailsLabel: "Card details",
  number: { label: "Card number", placeholder: "1234 5678 9012 3456" },
  expiry: { label: "Expiry", placeholder: "MM/YY" },
  cvc: { label: "CVC", placeholder: "CVC" },
  name: { label: "Cardholder name", placeholder: "Name on card" },
  invalidNumber: "This card number looks invalid.",
};

export interface CreditCardInputProps {
  value: CreditCardValue;
  onValueChange: (value: CreditCardValue) => void;
  /**
   * Which fields to render. Each defaults to `true`; pass `false` to hide one,
   * e.g. `fields={{ cvc: false }}`.
   */
  fields?: Partial<Record<CardField, boolean>>;
  /** Localised labels/placeholders. Falls back to English defaults. */
  messages?: CreditCardInputMessages;
  /** Show the detected brand logo in the number field. Default `true`. */
  showBrandIcon?: boolean;
  /** Show a Luhn-based validity hint under the number. Default `true`. */
  validateNumber?: boolean;
  disabled?: boolean;
  /** Prefix for element ids + `data-testid`s. Default `"credit-card"`. */
  idPrefix?: string;
  className?: string;
}

const NARROW_FIELD_CLASS =
  "flex-none border-l border-input pl-3 text-center font-mono";

export function CreditCardInput({
  value,
  onValueChange,
  fields,
  messages,
  showBrandIcon = true,
  validateNumber = true,
  disabled,
  idPrefix = "credit-card",
  className,
}: CreditCardInputProps) {
  const show = {
    number: fields?.number ?? true,
    expiry: fields?.expiry ?? true,
    cvc: fields?.cvc ?? true,
    name: fields?.name ?? true,
  };
  const m = {
    cardDetailsLabel:
      messages?.cardDetailsLabel ?? DEFAULT_MESSAGES.cardDetailsLabel,
    number: { ...DEFAULT_MESSAGES.number, ...messages?.number },
    expiry: { ...DEFAULT_MESSAGES.expiry, ...messages?.expiry },
    cvc: { ...DEFAULT_MESSAGES.cvc, ...messages?.cvc },
    name: { ...DEFAULT_MESSAGES.name, ...messages?.name },
    invalidNumber: messages?.invalidNumber ?? DEFAULT_MESSAGES.invalidNumber,
  };

  const brand = getCardBrand(value.number);
  const numberDigits = onlyDigits(value.number);
  const numberInvalid =
    validateNumber && numberDigits.length >= 12 && !luhnValid(numberDigits);

  function patch(next: Partial<CreditCardValue>) {
    onValueChange({ ...value, ...next });
  }

  const hasDetailsRow = show.number || show.expiry || show.cvc;
  // The merged row's accessible label points at the first visible control.
  const detailsLabelFor = show.number
    ? `${idPrefix}-number`
    : show.expiry
      ? `${idPrefix}-expiry`
      : `${idPrefix}-cvc`;

  return (
    <FieldGroup className={cn("gap-2", className)}>
      {hasDetailsRow ? (
        <Field data-invalid={numberInvalid || undefined} className="gap-1">
          <FieldLabel
            htmlFor={detailsLabelFor}
            data-testid={`${idPrefix}-card-details-label`}
          >
            {m.cardDetailsLabel}
          </FieldLabel>
          <InputGroup>
            {show.number && showBrandIcon ? (
              <InputGroupAddon>
                <CardBrandIcon brand={brand} />
              </InputGroupAddon>
            ) : null}

            {show.number ? (
              <InputGroupInput
                id={`${idPrefix}-number`}
                name="cardnumber"
                className="font-mono tracking-wider"
                inputMode="numeric"
                autoComplete="cc-number"
                aria-label={m.number.label}
                aria-invalid={numberInvalid || undefined}
                placeholder={m.number.placeholder}
                value={value.number}
                disabled={disabled}
                onChange={(e) =>
                  patch({ number: formatCardNumber(e.target.value) })
                }
                data-testid={`${idPrefix}-number-input`}
              />
            ) : null}

            {show.expiry ? (
              <InputGroupInput
                id={`${idPrefix}-expiry`}
                name="cc-exp"
                className={cn("w-20", show.number && NARROW_FIELD_CLASS)}
                inputMode="numeric"
                autoComplete="cc-exp"
                aria-label={m.expiry.label}
                placeholder={m.expiry.placeholder}
                value={value.expiry}
                disabled={disabled}
                onChange={(e) =>
                  patch({ expiry: normalizeExpiry(e.target.value) })
                }
                data-testid={`${idPrefix}-expiry-input`}
              />
            ) : null}

            {show.cvc ? (
              <InputGroupInput
                id={`${idPrefix}-cvc`}
                name="cvc"
                className={cn(
                  "w-16",
                  (show.number || show.expiry) && NARROW_FIELD_CLASS
                )}
                inputMode="numeric"
                autoComplete="cc-csc"
                aria-label={m.cvc.label}
                placeholder={m.cvc.placeholder}
                value={value.cvc}
                disabled={disabled}
                onChange={(e) =>
                  patch({ cvc: formatCvc(e.target.value, brand) })
                }
                data-testid={`${idPrefix}-cvc-input`}
              />
            ) : null}
          </InputGroup>
          {numberInvalid ? (
            <FieldError data-testid={`${idPrefix}-number-error`}>
              {m.invalidNumber}
            </FieldError>
          ) : null}
        </Field>
      ) : null}

      {show.name ? (
        <Field className="gap-1">
          <FieldLabel
            htmlFor={`${idPrefix}-name`}
            data-testid={`${idPrefix}-name-label`}
          >
            {m.name.label}
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <User aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id={`${idPrefix}-name`}
              name="ccname"
              autoComplete="cc-name"
              placeholder={m.name.placeholder}
              value={value.name}
              disabled={disabled}
              onChange={(e) => patch({ name: e.target.value })}
              data-testid={`${idPrefix}-name-input`}
            />
          </InputGroup>
        </Field>
      ) : null}
    </FieldGroup>
  );
}
