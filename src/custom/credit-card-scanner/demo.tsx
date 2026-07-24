"use client";

import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ayasofyazilim-ui/components/card";
import { useState } from "react";
import {
  CreditCardScanner,
  type CreditCardData,
  type ExternalCardExtractionResult,
  type ExternalExtractionInput,
} from "@repo/ayasofyazilim-ui/custom/credit-card-scanner";
import { brandLabel } from "./lib";

// Stand-in for the real backend call a consuming app would make here - e.g. a
// server action that submits `input.croppedImageBase64` (and optionally the
// other variants) as an extraction API's `documents` and maps whichever
// comes back into { number, expiry }. This is only illustrative: the scanner
// itself is backend-agnostic and never calls out on its own (see the
// `externalExtraction` prop doc).
async function fakeExternalExtraction(
  input: ExternalExtractionInput
): Promise<ExternalCardExtractionResult | null> {
  void input;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    number: "4111111111111111",
    expiry: "12/29",
    matchedVariant: "cropped",
  };
}

/**
 * Demo for the CreditCardScanner. Point the rear camera at a card and the
 * scanner reads the number, validates it (Luhn + brand), and - when present -
 * the expiry date. Captured cards appear in the panel on the right.
 *
 * Also demonstrates the `externalExtraction` fallback: after a few seconds of
 * unsuccessful local OCR (the common case for embossed cards, whose raised
 * digits defeat the flat-print contrast heuristics), the scanner starts
 * polling `fakeExternalExtraction` above whenever its presence probe sees a
 * card-like object in the viewfinder - brackets amber while a card is
 * detected, pill sky-blue while a backend call is actually in flight. No tap
 * required at any point.
 */
export function CreditCardScannerDemo() {
  const [results, setResults] = useState<CreditCardData[]>([]);

  const handleScan = (data: CreditCardData) => {
    setResults((prev) => [data, ...prev].slice(0, 6));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">CreditCardScanner - Demo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Camera + Tesseract.js OCR. The card number is confirmed only once it
          passes the Luhn check and the same value is read twice, which guards
          against single-frame misreads. Numbers are masked in the UI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Scanner</CardTitle>
            <CardDescription>
              Fit the card inside the frame. It captures automatically once the
              same number is read on consecutive passes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreditCardScanner
              onScan={handleScan}
              debug
              externalExtraction={fakeExternalExtraction}
              externalExtractionAfterMs={4000}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Captured</CardTitle>
            <CardDescription>
              The most recent scans (newest first).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing scanned yet - point the camera at a card.
              </p>
            ) : (
              results.map((r, i) => (
                <div
                  key={`${r.number}-${i}`}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {/* in-memory data URL frame, not a remote asset */}
                  <img
                    src={r.imageBase64}
                    alt="Captured card"
                    className="h-14 w-24 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-medium">
                      {maskForDisplay(r.formattedNumber)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {brandLabel(r.brand)}
                      {r.expiry ? ` · exp ${r.expiry}` : ""}
                      {" · "}
                      {r.source === "external"
                        ? `backend (${r.variant ?? "unknown"})`
                        : "local OCR"}
                    </div>
                  </div>
                </div>
              ))
            )}
            {results.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setResults([])}
              >
                Clear
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Mask a grouped card number for display: keep first and last 4 digits. */
function maskForDisplay(formatted: string): string {
  const digits = formatted.replace(/\D/g, "");
  if (digits.length <= 8) return formatted;
  let seen = 0;
  return formatted.replace(/\d/g, (d) => {
    seen += 1;
    return seen <= 4 || seen > digits.length - 4 ? d : "•";
  });
}
