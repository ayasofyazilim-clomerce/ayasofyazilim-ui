import { BarcodeFormat } from "@zxing/library";

// ── W3C Barcode Detection API types (Chrome/Edge/Safari 17+) ─────────────────
export interface BarcodeDetectorResult {
  rawValue: string;
  format: string;
}
export interface BarcodeDetectorCtor {
  new (options?: { formats: string[] }): {
    detect(
      source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap
    ): Promise<BarcodeDetectorResult[]>;
  };
  getSupportedFormats(): Promise<string[]>;
}

/**
 * Barcode formats the scanners can recognise. Names follow the W3C Barcode
 * Detection API; each maps to its ZXing equivalent for the software fallback.
 */
export type BarcodeFormatName =
  | "aztec"
  | "code_128"
  | "code_39"
  | "code_93"
  | "data_matrix"
  | "ean_13"
  | "ean_8"
  | "itf"
  | "pdf417"
  | "qr_code"
  | "upc_a"
  | "upc_e";

// Maps each public format name to its ZXing enum (used by the software
// fallback). The keys double as the native BarcodeDetector format strings, so
// both decode paths stay in sync from a single source of truth.
export const FORMAT_TO_ZXING: Record<BarcodeFormatName, BarcodeFormat> = {
  aztec: BarcodeFormat.AZTEC,
  code_128: BarcodeFormat.CODE_128,
  code_39: BarcodeFormat.CODE_39,
  code_93: BarcodeFormat.CODE_93,
  data_matrix: BarcodeFormat.DATA_MATRIX,
  ean_13: BarcodeFormat.EAN_13,
  ean_8: BarcodeFormat.EAN_8,
  itf: BarcodeFormat.ITF,
  pdf417: BarcodeFormat.PDF_417,
  qr_code: BarcodeFormat.QR_CODE,
  upc_a: BarcodeFormat.UPC_A,
  upc_e: BarcodeFormat.UPC_E,
};

// Every supported format - the default set when the caller doesn't restrict it.
export const ALL_BARCODE_FORMATS = Object.keys(
  FORMAT_TO_ZXING
) as BarcodeFormatName[];

/**
 * The native detector constructor, or null where the API is absent - Firefox
 * entirely, and Safari before it shipped the API. Callers fall back to ZXing.
 */
export function getNativeBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  return typeof window !== "undefined" && "BarcodeDetector" in window
    ? (window as unknown as { BarcodeDetector: BarcodeDetectorCtor })
        .BarcodeDetector
    : null;
}
