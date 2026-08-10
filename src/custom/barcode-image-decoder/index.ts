"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import {
  ALL_BARCODE_FORMATS,
  FORMAT_TO_ZXING,
  getNativeBarcodeDetectorCtor,
  type BarcodeFormatName,
} from "../barcode-formats";
import { buildDecodeScales } from "./lib";

export { buildDecodeScales };

export interface DecodeBarcodeFromImageOptions {
  /** Restrict the decode. Defaults to every supported format. */
  formats?: BarcodeFormatName[];
}

async function toBitmap(
  source: Blob | ImageBitmap | HTMLCanvasElement
): Promise<ImageBitmap> {
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return source;
  }
  return createImageBitmap(source as Blob | HTMLCanvasElement);
}

function drawAt(bitmap: ImageBitmap, edge: number): HTMLCanvasElement {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Reads the first barcode in a still image: native `BarcodeDetector` where the
 * browser has it, ZXing everywhere else. Tries `buildDecodeScales` largest
 * first and stops at the first hit; no rotation retries, since QR / Data
 * Matrix / Aztec self-orient. Returns null on a miss rather than throwing -
 * the caller treats a miss as an ordinary outcome.
 */
export async function decodeBarcodeFromImage(
  source: Blob | ImageBitmap | HTMLCanvasElement,
  options: DecodeBarcodeFromImageOptions = {}
): Promise<string | null> {
  const formats =
    options.formats && options.formats.length > 0
      ? options.formats
      : ALL_BARCODE_FORMATS;

  let bitmap: ImageBitmap;
  try {
    bitmap = await toBitmap(source);
  } catch {
    return null;
  }

  const scales = buildDecodeScales(bitmap.width, bitmap.height);
  const BDCtor = getNativeBarcodeDetectorCtor();

  try {
    if (BDCtor) {
      let nativeFormats: string[] = formats;
      try {
        const supported = new Set(await BDCtor.getSupportedFormats());
        nativeFormats = formats.filter((f) => supported.has(f));
      } catch {
        nativeFormats = [];
      }
      if (nativeFormats.length > 0) {
        const detector = new BDCtor({ formats: nativeFormats });
        for (const edge of scales) {
          try {
            const results = await detector.detect(drawAt(bitmap, edge));
            const hit = results.find((r) => r.rawValue);
            if (hit) return hit.rawValue;
          } catch {
            // one scale failing isn't fatal - the next one still gets a try
          }
        }
        return null;
      }
    }

    const hints = new Map();
    hints.set(
      DecodeHintType.POSSIBLE_FORMATS,
      formats.map((f) => FORMAT_TO_ZXING[f])
    );
    // Affordable here (unlike the video path): this runs a handful of times
    // against one picture, not every frame.
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);

    for (const edge of scales) {
      try {
        const result = reader.decodeFromCanvas(drawAt(bitmap, edge));
        const text = result.getText();
        if (text) return text;
      } catch {
        // ZXing throws NotFoundException per failed scale - expected
      }
    }
    return null;
  } finally {
    // Only close a bitmap we made; the caller still owns one they passed in.
    if (bitmap !== source) bitmap.close();
  }
}
