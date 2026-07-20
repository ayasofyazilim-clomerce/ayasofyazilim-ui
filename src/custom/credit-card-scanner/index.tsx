"use client";

import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { CheckCircle2Icon, Loader2Icon, RotateCcwIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraSurface, useCameraStream } from "../camera-stream";
import {
  type CardBrand,
  brandLabel,
  detectBrand,
  extractExpiry,
  formatCardNumber,
  extractCardNumber,
  hasPlausibleDigitRun,
  luhnCheck,
  maskCardNumber,
} from "./lib";
import { readCardText } from "./ocr";

// ── Decode region (ROI) ───────────────────────────────────────────────────────
// We OCR only the card-shaped viewfinder region rather than the whole frame:
// it keeps the card text near native resolution and strips background clutter
// that produces spurious digits. The ROI grows by this fraction on each side so
// a card not perfectly inside the guide still reads.
const ROI_PADDING = 0.08;
// Cap the OCR canvas width — bounds Tesseract's per-pass cost while leaving the
// card number sharp (the ROI is already only the card, not the whole frame).
const MAX_OCR_WIDTH = 1000;

/**
 * Source crop rectangle (in video-intrinsic px) matching the on-screen
 * viewfinder, accounting for the video element's `object-cover` scaling.
 * Returns null when geometry isn't available yet — callers fall back to the
 * full frame.
 */
function computeViewfinderRoi(
  video: HTMLVideoElement,
  viewfinderEl: HTMLElement | null
): { sx: number; sy: number; sw: number; sh: number } | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || !viewfinderEl) return null;
  const videoRect = video.getBoundingClientRect();
  const vfRect = viewfinderEl.getBoundingClientRect();
  if (videoRect.width === 0 || videoRect.height === 0) return null;
  // `object-cover` scales the video to cover the element box, cropping overflow.
  const scale = Math.max(videoRect.width / vw, videoRect.height / vh);
  const contentLeft = (videoRect.width - vw * scale) / 2;
  const contentTop = (videoRect.height - vh * scale) / 2;
  let sx = (vfRect.left - videoRect.left - contentLeft) / scale;
  let sy = (vfRect.top - videoRect.top - contentTop) / scale;
  let sw = vfRect.width / scale;
  let sh = vfRect.height / scale;
  const padX = sw * ROI_PADDING;
  const padY = sh * ROI_PADDING;
  sx = Math.max(0, sx - padX);
  sy = Math.max(0, sy - padY);
  sw = Math.min(vw - sx, sw + padX * 2);
  sh = Math.min(vh - sy, sh + padY * 2);
  return { sx, sy, sw, sh };
}

// ── Card-presence probe ──────────────────────────────────────────────────────
// Auto-triggering the (paid, slower) backend fallback on every frame would
// send garbage on a blank viewfinder — a hand, a wall, a lens cap. This is
// the cheap per-tick check for "there's *something* card-like in frame":
// downsample the viewfinder ROI to a small grayscale probe (small enough to
// compute cheaply every tick, but not so small a card's real texture — its
// printed number, chip, logo — gets smoothed away) and gate on `stddev`
// alone. Edge energy is computed too but only as a *logged* signal, not a
// hard gate, until it's been calibrated against real footage.
//
// This used to also require the frame to hold *still* for a stretch before
// firing (frame-to-frame luminance diffing). In practice that motion-based
// "steady" detection was unreliable — it either never registered "still" on
// real footage or added a wait the backend (a vision model, not a strict
// per-pixel OCR crop) didn't actually need. Dropped it entirely: the trigger
// below now just polls the backend on a fixed interval — see
// `EXTERNAL_RETRY_BASE_COOLDOWN_MS` — as long as this probe sees content and
// `hasPlausibleDigitRun` corroborates it, no waiting for the frame to stop
// moving first.
const PRESENCE_PROBE_WIDTH = 48;
const PRESENCE_PROBE_HEIGHT = 30;
const MIN_CONTENT_STDDEV = 6; // guards against a blank wall / lens cap
const PRESENCE_SAMPLE_MS = 150;
const EXTERNAL_RETRY_BASE_COOLDOWN_MS = 4000;
const EXTERNAL_RETRY_MAX_COOLDOWN_MS = 16000;
// Pixel content alone can't tell a card from a hand in frame — real
// corroboration from OCR (`hasPlausibleDigitRun`) is required before the
// auto-trigger fires. But some cards genuinely produce zero OCR text no
// matter how long you wait (the exact case the fallback exists for), so
// after this long without any corroboration ever, the requirement relaxes
// and pixel content alone becomes enough — never a permanent block.
const OCR_GATE_RELAX_AFTER_MS = 15000;

type ProbeStage = "empty" | "content";

interface CardPresenceProbe {
  stage: ProbeStage;
  /** Raw metrics behind `stage`, for debug logging / future threshold tuning. */
  metrics: { stddev: number; edgeEnergyPerPixel: number };
}

/** One presence-probe tick. Returns null when there's no frame geometry yet. */
function probeCardPresence(
  video: HTMLVideoElement,
  viewfinderEl: HTMLElement | null,
  canvas: HTMLCanvasElement
): CardPresenceProbe | null {
  const roi = computeViewfinderRoi(video, viewfinderEl);
  const sx = roi?.sx ?? 0;
  const sy = roi?.sy ?? 0;
  const sw = roi?.sw ?? video.videoWidth;
  const sh = roi?.sh ?? video.videoHeight;
  if (!sw || !sh) return null;

  // Only (re)allocate the backing buffer when the size actually changed —
  // this runs every probe tick, and re-setting width/height forces a clear +
  // realloc even when assigning the same values.
  if (
    canvas.width !== PRESENCE_PROBE_WIDTH ||
    canvas.height !== PRESENCE_PROBE_HEIGHT
  ) {
    canvas.width = PRESENCE_PROBE_WIDTH;
    canvas.height = PRESENCE_PROBE_HEIGHT;
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(
    video,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    PRESENCE_PROBE_WIDTH,
    PRESENCE_PROBE_HEIGHT
  );

  const { data } = ctx.getImageData(
    0,
    0,
    PRESENCE_PROBE_WIDTH,
    PRESENCE_PROBE_HEIGHT
  );
  const count = PRESENCE_PROBE_WIDTH * PRESENCE_PROBE_HEIGHT;
  const luminance = new Float32Array(count);
  let sum = 0;
  for (let p = 0; p < count; p++) {
    const i = p * 4;
    const l =
      ((data[i] ?? 0) * 299 + (data[i + 1] ?? 0) * 587 + (data[i + 2] ?? 0) * 114) /
      1000;
    luminance[p] = l;
    sum += l;
  }
  const mean = sum / count;
  let variance = 0;
  for (let p = 0; p < count; p++) {
    const d = (luminance[p] ?? 0) - mean;
    variance += d * d;
  }
  const stddev = Math.sqrt(variance / count);

  // Edge energy: sum of horizontal + vertical luminance gradients. A blank
  // wall or an out-of-focus background is smooth; printed card content
  // (number, chip, logo, hologram) isn't. Logged but not gated on yet — see
  // the comment above this function.
  let edgeEnergy = 0;
  for (let y = 0; y < PRESENCE_PROBE_HEIGHT; y++) {
    for (let x = 0; x < PRESENCE_PROBE_WIDTH; x++) {
      const p = y * PRESENCE_PROBE_WIDTH + x;
      const l = luminance[p] ?? 0;
      if (x + 1 < PRESENCE_PROBE_WIDTH) {
        edgeEnergy += Math.abs(l - (luminance[p + 1] ?? l));
      }
      if (y + 1 < PRESENCE_PROBE_HEIGHT) {
        edgeEnergy += Math.abs(l - (luminance[p + PRESENCE_PROBE_WIDTH] ?? l));
      }
    }
  }
  const edgeEnergyPerPixel = edgeEnergy / count;

  return {
    stage: stddev < MIN_CONTENT_STDDEV ? "empty" : "content",
    metrics: { stddev, edgeEnergyPerPixel },
  };
}

/**
 * Crop the current frame to the (padded) viewfinder ROI, in full color and at
 * capture resolution — unlike `drawOcrFrame`, this feeds a vision-model
 * backend rather than Tesseract, so it skips the grayscale/contrast-stretch
 * pass entirely. This is what `externalExtraction` should be sent instead of
 * the raw full frame: a photo of "a card somewhere in a room" wastes most of
 * its resolution on background the model has to first locate the card
 * within; a tight crop puts the card at (near) full frame. Returns null when
 * there's no frame geometry yet.
 */
function cropViewfinderToDataUrl(
  video: HTMLVideoElement,
  viewfinderEl: HTMLElement | null,
  canvas: HTMLCanvasElement,
  quality: number
): string | null {
  const roi = computeViewfinderRoi(video, viewfinderEl);
  const sx = roi?.sx ?? 0;
  const sy = roi?.sy ?? 0;
  const sw = roi?.sw ?? video.videoWidth;
  const sh = roi?.sh ?? video.videoHeight;
  if (!sw || !sh) return null;

  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Invert every pixel's RGB channels (a photographic negative) of whatever is
 * currently drawn on `canvas` and re-export it. A cheap fallback variant for
 * embossed cards: the raised digits' natural light/shadow contrast doesn't
 * always read well as-is, and inverting sometimes turns a faint shadow edge
 * into a much stronger, more legible one. Must be called right after
 * `cropViewfinderToDataUrl` drew into the same canvas — reads back exactly
 * what's currently on it. Returns null if nothing has been drawn yet.
 */
function invertCanvasToDataUrl(
  canvas: HTMLCanvasElement,
  quality: number
): string | null {
  if (!canvas.width || !canvas.height) return null;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - (d[i] ?? 0);
    d[i + 1] = 255 - (d[i + 1] ?? 0);
    d[i + 2] = 255 - (d[i + 2] ?? 0);
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Grayscale + min–max contrast stretch, applied in place to whatever is
 * currently drawn on `canvas`. High-contrast monochrome is what Tesseract
 * reads best — it lifts faint flat-printed digits off a busy card
 * background — and the same stretch also sharpens embossed-digit
 * light/shadow edges for the backend "inverted" variant (see
 * `drawEnhancedFrame`). Shared so both consumers apply the identical pass;
 * only the resolution they draw at first differs.
 */
function applyGrayscaleContrastStretch(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const { width: dw, height: dh } = canvas;
  const img = ctx.getImageData(0, 0, dw, dh);
  const d = img.data;
  let min = 255;
  let max = 0;
  // First pass: convert to luminance (stored in R) and track the range. The
  // RGBA buffer length is always a multiple of 4, so i+1/i+2 are in range.
  for (let i = 0; i < d.length; i += 4) {
    const g =
      ((d[i] ?? 0) * 299 + (d[i + 1] ?? 0) * 587 + (d[i + 2] ?? 0) * 114) /
      1000;
    d[i] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const span = max - min || 1;
  // Second pass: stretch to the full 0–255 range and write all channels.
  for (let i = 0; i < d.length; i += 4) {
    const v = ((d[i] ?? 0) - min) * (255 / span);
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Draw the viewfinder ROI (or the whole frame, until geometry is ready) into
 * `canvas`, capped to `MAX_OCR_WIDTH`, then apply the grayscale/contrast-
 * stretch pass. The width cap exists purely to bound Tesseract's per-frame
 * cost locally — see `drawEnhancedFrame` for the same pass at full
 * resolution. Returns null when there's nothing to draw.
 */
function drawOcrFrame(
  video: HTMLVideoElement,
  viewfinderEl: HTMLElement | null,
  canvas: HTMLCanvasElement
): HTMLCanvasElement | null {
  const roi = computeViewfinderRoi(video, viewfinderEl);
  const sx = roi?.sx ?? 0;
  const sy = roi?.sy ?? 0;
  const sw = roi?.sw ?? video.videoWidth;
  const sh = roi?.sh ?? video.videoHeight;
  if (!sw || !sh) return null;
  const scale = Math.min(1, MAX_OCR_WIDTH / sw);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  if (canvas.width !== dw || canvas.height !== dh) {
    canvas.width = dw;
    canvas.height = dh;
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh);
  applyGrayscaleContrastStretch(canvas);
  return canvas;
}

/**
 * Same grayscale + contrast-stretch pass as `drawOcrFrame`, but drawn at full
 * capture resolution instead of downscaled to `MAX_OCR_WIDTH` — that cap only
 * exists to bound Tesseract's local per-frame cost, and reusing it for the
 * image sent to the backend would throw away resolution the vision model
 * doesn't need thrown away. Returns null when there's nothing to draw.
 */
function drawEnhancedFrame(
  video: HTMLVideoElement,
  viewfinderEl: HTMLElement | null,
  canvas: HTMLCanvasElement
): HTMLCanvasElement | null {
  const roi = computeViewfinderRoi(video, viewfinderEl);
  const sx = roi?.sx ?? 0;
  const sy = roi?.sy ?? 0;
  const sw = roi?.sw ?? video.videoWidth;
  const sh = roi?.sh ?? video.videoHeight;
  if (!sw || !sh) return null;
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
  applyGrayscaleContrastStretch(canvas);
  return canvas;
}

// ── Public API ────────────────────────────────────────────────────────────────

// Re-exported so consumers typing an `onScan`/`externalExtraction` handler
// (which deal in `CreditCardData.brand`) don't need a separate import from
// this package's internal `lib` module.
export type { CardBrand };
export { brandLabel };

export interface CreditCardData {
  /** The detected card number, digits only. */
  number: string;
  /** Card number grouped for display (e.g. "4111 1111 1111 1111"). */
  formattedNumber: string;
  /** Recognised card scheme, or "unknown" if the BIN doesn't match a known one. */
  brand: CardBrand;
  /** Expiry as "MM/YY" when one was read in the same frame, else null. */
  expiry: string | null;
  /** The captured frame as a Base64 `image/jpeg` data URL. */
  imageBase64: string;
  /** Which path produced this result: on-device OCR, or the `externalExtraction` fallback. */
  source: "local" | "external";
  /**
   * Which image variant the `externalExtraction` fallback matched on (e.g.
   * "cropped", "inverted") — whatever string it returned as
   * `matchedVariant`. Undefined for local-OCR results. Purely diagnostic:
   * useful for logging/UI while tuning what a given backend actually needs.
   */
  variant?: string;
}

export interface CreditCardScannerLabels {
  /** Shown while requesting camera permission. */
  requesting?: string;
  /** Shown when permission was denied. */
  permissionDenied?: string;
  /** Shown when no camera is found. */
  noCamera?: string;
  /** Placeholder / display name for the rear/environment-facing camera. */
  backCamera?: string;
  /** Display name for the front/user-facing camera. */
  frontCamera?: string;
  /** Generic camera label prefix when facing mode is unknown. */
  camera?: string;
  /** Accessible label for the torch / flashlight toggle button. */
  torch?: string;
  /** Shown continuously while the scanner is searching for a card number. */
  scanning?: string;
  /** Overlay title shown after a successful capture. */
  captured?: string;
  /** "Scan again" button label. */
  scanAgain?: string;
  /** Label for the button that re-requests camera access after a failure. */
  retry?: string;
  /** Shown when the backend-extraction fallback couldn't read the card. */
  extractionFailed?: string;
  /** Shown while a card-like object is detected in the viewfinder and the backend fallback is being tried periodically. */
  cardDetected?: string;
  /** Shown while a backend-extraction call is actually in flight. */
  extracting?: string;
}

/** Result handed back by an `externalExtraction` callback. */
export interface ExternalCardExtractionResult {
  /** Card number digits, or null/omitted if none was found. */
  number?: string | null;
  /** Expiry as "MM/YY", or null/omitted if none was found. */
  expiry?: string | null;
  /** Which submitted image variant this result came from, for diagnostics (see `CreditCardData.variant`). */
  matchedVariant?: string;
}

/**
 * Image variants handed to `externalExtraction`. The scanner generates these
 * from the current frame (plain canvas work — crop + invert, no backend
 * awareness); which one(s) to actually submit is the caller's call, e.g.
 * submitting several as separate `documents` in one extraction-API request
 * and picking whichever comes back with a result.
 */
export interface ExternalExtractionInput {
  /**
   * The card cropped to the viewfinder guide, full color, unprocessed — the
   * recommended primary candidate. The full frame typically has the card
   * occupying a fraction of the picture surrounded by background; this
   * crop puts it at (near) full resolution instead.
   */
  croppedImageBase64: string;
  /**
   * The crop run through the same grayscale + contrast-stretch pass used for
   * local OCR (see `drawOcrFrame`/`drawEnhancedFrame` — the pass already
   * tuned to lift faint digits off a busy card background), but at full
   * capture resolution rather than downscaled for Tesseract, then inverted.
   * A fallback for embossed cards whose natural light/shadow contrast
   * doesn't read well as-is.
   */
  invertedImageBase64: string;
  /** The full, unprocessed camera frame — a fallback in case the card extends past the guide. */
  fullFrameImageBase64: string;
}

export interface CreditCardScannerProps {
  /**
   * Called once a card number has been confirmed — the same Luhn-valid number
   * read `requiredMatches` times — with the parsed data and the captured frame.
   */
  onScan: (data: CreditCardData) => void;
  /** Minimum interval between OCR passes, in ms. OCR is heavy — keep this high. @default 600 */
  scanIntervalMs?: number;
  /**
   * How many times the *same* Luhn-valid number must be read before capturing.
   * Higher is more robust against single-frame OCR misreads. @default 2
   */
  requiredMatches?: number;
  /** JPEG quality for the captured image, 0–1. High by default since this also feeds the backend-extraction fallback, where compression artifacts around fine embossed digits cost more than the extra bytes. @default 0.95 */
  imageQuality?: number;
  /**
   * Aspect ratio of the camera viewport, as any valid CSS `aspect-ratio` value.
   * @default "16 / 10"
   */
  aspectRatio?: string;
  /** Logs scan-lifecycle events (card numbers masked) to an on-screen overlay + console. @default false */
  debug?: boolean;
  labels?: CreditCardScannerLabels;
  /**
   * Optional server-side fallback for cards the local OCR can't read reliably
   * — most commonly embossed cards, whose raised digits (and the shadows they
   * cast) defeat the flat-print contrast heuristics `ocr.ts` is tuned for.
   * Receives a few pre-cropped/inverted image variants (see
   * `ExternalExtractionInput` — submitting more than one as separate
   * `documents` in a single extraction-API request is usually the right
   * move, since a raw full-frame photo wastes most of its resolution on
   * background) and should resolve with the extracted number/expiry, or
   * `null` when nothing could be extracted.
   *
   * Fires automatically — never on every frame, and never before local OCR
   * has had `externalExtractionAfterMs` to find a match on its own. Once
   * armed, it polls: any tick where the on-device presence probe (see the
   * scan loop) sees card-like content in the viewfinder *and*
   * `hasPlausibleDigitRun` has corroborated it from a recent OCR pass, this
   * fires — on a fixed interval with exponential backoff between attempts
   * if it keeps coming back empty. There's deliberately no wait for the
   * frame to hold still first: this is a vision-model backend, not a strict
   * per-pixel OCR crop, and an on-device motion-based "steady" gate tried
   * here previously proved unreliable in practice. The caller owns the
   * actual network request (e.g. a server action proxying a document/OCR
   * extraction API) — this package has no backend of its own.
   */
  externalExtraction?: (
    input: ExternalExtractionInput
  ) => Promise<ExternalCardExtractionResult | null>;
  /** How long (ms) local OCR gets before the automatic backend-extraction fallback becomes eligible to trigger. @default 6000 */
  externalExtractionAfterMs?: number;
}

const DEFAULT_LABELS: Required<CreditCardScannerLabels> = {
  requesting: "Requesting camera access…",
  permissionDenied:
    "Camera access was denied. Please allow camera access and reload.",
  noCamera: "No camera found on this device.",
  backCamera: "Back Camera",
  frontCamera: "Front Camera",
  camera: "Camera",
  torch: "Toggle flashlight",
  scanning: "Scanning…",
  captured: "Card captured",
  scanAgain: "Scan again",
  retry: "Try again",
  extractionFailed: "We couldn't read this card. Reposition and try again.",
  cardDetected: "Card detected…",
  extracting: "Reading card…",
};

const DEFAULT_EXTERNAL_EXTRACTION_AFTER_MS = 6000;

export function CreditCardScanner({
  onScan,
  scanIntervalMs = 600,
  requiredMatches = 2,
  imageQuality = 0.95,
  aspectRatio = "16 / 10",
  debug = false,
  labels,
  externalExtraction,
  externalExtractionAfterMs = DEFAULT_EXTERNAL_EXTRACTION_AFTER_MS,
}: CreditCardScannerProps) {
  const resolvedLabels = useMemo<Required<CreditCardScannerLabels>>(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels]
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  // Off-screen canvas the OCR ROI is rendered into.
  const ocrCanvasRef = useRef<HTMLCanvasElement>(null);
  // Full-resolution canvas for the captured JPEG.
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  // Tiny off-screen canvas the card-presence probe downsamples into.
  const probeCanvasRef = useRef<HTMLCanvasElement>(null);
  // The on-screen card-shaped viewfinder — its rect drives the OCR ROI crop.
  const viewfinderRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Mirror props into refs so the long-lived scan loop reads fresh values.
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const scanIntervalMsRef = useRef(scanIntervalMs);
  scanIntervalMsRef.current = scanIntervalMs;
  const requiredMatchesRef = useRef(requiredMatches);
  requiredMatchesRef.current = requiredMatches;
  const imageQualityRef = useRef(imageQuality);
  imageQualityRef.current = imageQuality;
  const debugRef = useRef(debug);
  debugRef.current = debug;
  const externalExtractionRef = useRef(externalExtraction);
  externalExtractionRef.current = externalExtraction;
  const hasExternalExtraction = Boolean(externalExtraction);

  // Loop bookkeeping.
  const pausedRef = useRef(false); // true after capture (shows captured state)
  const ocrBusyRef = useRef(false); // guards against stacking OCR passes
  const lastOcrAtRef = useRef(0);
  // Stability: the last Luhn-valid number seen and how many consecutive passes
  // have agreed on it. Drives the auto-capture threshold.
  const candidateRef = useRef<{ number: string; count: number }>({
    number: "",
    count: 0,
  });
  // Presence-probe bookkeeping for the automatic backend-extraction trigger
  // (see `probeCardPresence` above and the scan loop below).
  const lastProbeAtRef = useRef(0);
  const lastMetricsLogAtRef = useRef(0);
  const lastExternalAttemptAtRef = useRef(0);
  // Set by `runOcrPass` on every pass (see `hasPlausibleDigitRun`) — real
  // evidence from the OCR engine that there's card-like printed content in
  // view, not just pixel content/texture. Required (with a relax-after-
  // timeout escape hatch) before the pixel probe below is trusted enough to
  // fire the backend fallback automatically.
  const recentOcrHadDigitsRef = useRef(false);
  // Timestamp of the first tick where the external-extraction trigger became
  // reachable at all (see the `externalArmed` effect) — used to relax
  // the OCR-corroboration requirement after a long stretch of eligibility
  // with zero corroboration, so a card OCR truly can't read anything on
  // doesn't permanently block its own fallback.
  const firstEligibleAtRef = useRef<number | null>(null);
  // Consecutive failed/empty external attempts — backs off the retry cooldown
  // (capped) so a scanner pointed at the wrong thing doesn't hammer the
  // backend every time the probe re-settles. Reset on success or scan-again.
  const consecutiveExternalFailuresRef = useRef(0);
  // Re-entrancy guard for the external call. Must be a ref, not state — the
  // scan loop below reads it every animation frame, and a state update isn't
  // visible until the next render, which is too slow to prevent a double-fire.
  const externalExtractingRef = useRef(false);
  // True once the component has unmounted. A backend call resolving after
  // that must not fire `onScan` — by then the consumer has moved on, and a
  // late result would look like a brand-new scan.
  const disposedRef = useRef(false);
  useEffect(() => {
    // Reset on (re)mount — under StrictMode the cleanup below runs once
    // between the double-invoke, and the flag must not stay latched.
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
    };
  }, []);

  // The shared, ref-counted camera stream (see ../camera-stream). Requested once
  // per flow and reused across scanners, so the camera permission is asked once.
  const camera = useCameraStream({
    storageKey: "credit-card-scanner-camera-id",
  });

  // ── On-screen debug log (newest first) — for devices with no console ─────────
  const [debugLogs, setDebugLogs] = useState<
    { id: number; time: string; message: string; data?: string }[]
  >([]);
  const logSeqRef = useRef(0);
  const log = useCallback((message: string, data?: unknown) => {
    if (!debugRef.current) return;
    if (data !== undefined) {
      console.log(`[CreditCardScanner] ${message}`, data);
    } else {
      console.log(`[CreditCardScanner] ${message}`);
    }
    let dataStr: string | undefined;
    if (data !== undefined) {
      try {
        dataStr = typeof data === "string" ? data : JSON.stringify(data);
      } catch {
        dataStr = String(data);
      }
    }
    const id = (logSeqRef.current += 1);
    const time = new Date().toLocaleTimeString();
    setDebugLogs((prev) =>
      [{ id, time, message, data: dataStr }, ...prev].slice(0, 30)
    );
  }, []);

  const [paused, setPaused] = useState(false);

  // Backend-extraction fallback (see `externalExtraction` prop): only
  // eligible to auto-trigger once local OCR has had `externalExtractionAfterMs`
  // to find a match, and `scanEpoch` restarts that clock on every "scan again".
  const [scanEpoch, setScanEpoch] = useState(0);
  const [externalArmed, setExternalArmed] = useState(false);
  const externalArmedRef = useRef(externalArmed);
  externalArmedRef.current = externalArmed;
  const [externalExtractionFailed, setExternalExtractionFailed] =
    useState(false);
  // Render mirror of `externalExtractingRef` — drives the status pill so the
  // user can see when a backend attempt is actually in flight, rather than
  // the pill claiming "reading" the whole time a card sits in frame.
  const [externalExtracting, setExternalExtracting] = useState(false);
  // Presence feedback driven by `probeCardPresence`: "searching" — nothing
  // card-like in the viewfinder yet; "detected" — a card-like object was
  // found, so the automatic backend-extraction trigger is being tried
  // periodically (see the scan loop).
  const [presenceStage, setPresenceStage] = useState<"searching" | "detected">(
    "searching"
  );

  const resetScanState = useCallback(() => {
    candidateRef.current = { number: "", count: 0 };
    recentOcrHadDigitsRef.current = false;
  }, []);

  // Snapshot the current video frame into the full-res capture canvas.
  const snapshot = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, []);

  // Confirm a card number: capture the frame, hand the data to onScan, pause.
  const confirmCard = useCallback(
    (number: string, expiry: string | null) => {
      const canvas = snapshot();
      if (!canvas) return;
      const brand = detectBrand(number);
      const imageBase64 = canvas.toDataURL(
        "image/jpeg",
        imageQualityRef.current
      );
      pausedRef.current = true;
      setPaused(true);
      log("card confirmed", { masked: maskCardNumber(number), brand, expiry });
      onScanRef.current({
        number,
        formattedNumber: formatCardNumber(number, brand),
        brand,
        expiry,
        imageBase64,
        source: "local",
      });
    },
    [snapshot, log]
  );
  const confirmRef = useRef(confirmCard);
  confirmRef.current = confirmCard;

  // Run one OCR pass over the viewfinder ROI. On a valid read it updates the
  // stability counter and, once the same number has been read `requiredMatches`
  // times, confirms. Never blocks the scan loop.
  const runOcrPass = useCallback(async () => {
    if (ocrBusyRef.current || pausedRef.current) return;
    const video = videoRef.current;
    const ocrCanvas = ocrCanvasRef.current;
    if (!video || !ocrCanvas || !video.videoWidth) return;

    ocrBusyRef.current = true;
    lastOcrAtRef.current = performance.now();
    try {
      const source = drawOcrFrame(video, viewfinderRef.current, ocrCanvas);
      if (!source) return;
      const text = await readCardText(source);
      if (pausedRef.current) return;
      // Set on every pass regardless of outcome below — this is the signal
      // the presence probe's auto-trigger corroborates against (see
      // `hasPlausibleDigitRun`'s doc comment).
      recentOcrHadDigitsRef.current = hasPlausibleDigitRun(text);
      const number = extractCardNumber(text);
      const expiry = extractExpiry(text);

      if (!number) {
        log("ocr pass — no valid number");
        return;
      }

      // Debug only: the candidate is masked here and never surfaced in the
      // UI — the user sees a plain "scanning" state until a number is
      // confirmed, rather than partial brand/number guesses.
      log("ocr pass — candidate", {
        masked: maskCardNumber(number),
        brand: detectBrand(number),
        expiry,
      });

      // Require the same number across `requiredMatches` consecutive passes.
      const current = candidateRef.current;
      const count = current.number === number ? current.count + 1 : 1;
      candidateRef.current = { number, count };
      if (count >= requiredMatchesRef.current) {
        confirmRef.current(number, expiry);
      }
    } catch {
      /* OCR error — leave unconfirmed; the loop retries after cooldown */
    } finally {
      ocrBusyRef.current = false;
    }
  }, [log]);
  const runOcrPassRef = useRef(runOcrPass);
  runOcrPassRef.current = runOcrPass;

  const handleScanAgain = useCallback(() => {
    pausedRef.current = false;
    resetScanState();
    setPaused(false);
    setExternalExtractionFailed(false);
    setExternalArmed(false);
    setPresenceStage("searching");
    lastExternalAttemptAtRef.current = 0;
    consecutiveExternalFailuresRef.current = 0;
    setScanEpoch((epoch) => epoch + 1);
  }, [resetScanState]);

  // Arm the automatic backend-extraction trigger once local OCR has had a
  // fair chance to read the card. Anchored to the camera actually being
  // ready — counting from mount would let a slow permission prompt or camera
  // init eat local OCR's entire head start. Depends on
  // `hasExternalExtraction` (a boolean) rather than the callback itself,
  // since consumers typically pass a fresh function identity each render —
  // depending on the function would restart this timer every render and it
  // would never fire.
  useEffect(() => {
    if (!hasExternalExtraction || camera.status !== "ready") return undefined;
    setExternalArmed(false);
    firstEligibleAtRef.current = null;
    const timer = setTimeout(() => {
      setExternalArmed(true);
      firstEligibleAtRef.current = performance.now();
    }, externalExtractionAfterMs);
    return () => clearTimeout(timer);
  }, [hasExternalExtraction, externalExtractionAfterMs, scanEpoch, camera.status]);

  // Build the cropped/inverted/full-frame variants and hand them to the
  // caller-supplied `externalExtraction` fallback. Called from the scan loop
  // below on a fixed poll interval, once the presence probe sees a card and
  // OCR has corroborated it.
  const handleExternalExtraction = useCallback(async () => {
    const extract = externalExtractionRef.current;
    const video = videoRef.current;
    const cropCanvas = captureCanvasRef.current;
    if (
      !extract ||
      !video ||
      !cropCanvas ||
      pausedRef.current ||
      externalExtractingRef.current
    )
      return;

    const quality = imageQualityRef.current;
    // Sequential reuse of the same canvas is safe: each step reads back
    // exactly what the previous one drew, and every variant is fully read
    // out via toDataURL() before the next draw.
    const croppedImageBase64 = cropViewfinderToDataUrl(
      video,
      viewfinderRef.current,
      cropCanvas,
      quality
    );
    // Reuses the exact grayscale + contrast-stretch pipeline already proven
    // for local OCR (`drawOcrFrame`, feeding `ocr.ts`'s Tesseract worker) —
    // then inverts it. `drawEnhancedFrame` applies the identical pass at full
    // capture resolution instead of `drawOcrFrame`'s Tesseract-sized
    // downscale, since this image goes to the backend, not the local OCR
    // engine.
    const enhancedCanvas = drawEnhancedFrame(video, viewfinderRef.current, cropCanvas);
    const invertedImageBase64 = enhancedCanvas
      ? invertCanvasToDataUrl(enhancedCanvas, quality)
      : null;
    const fullFrameCanvas = snapshot();
    const fullFrameImageBase64 = fullFrameCanvas
      ? fullFrameCanvas.toDataURL("image/jpeg", quality)
      : null;
    if (!croppedImageBase64 || !invertedImageBase64 || !fullFrameImageBase64)
      return;

    externalExtractingRef.current = true;
    setExternalExtracting(true);
    setExternalExtractionFailed(false);
    log("external extraction — requesting");
    try {
      const extracted = await extract({
        croppedImageBase64,
        invertedImageBase64,
        fullFrameImageBase64,
      });
      // The world may have moved on while we awaited: local OCR can confirm
      // a card mid-flight (both paths run concurrently on purpose —
      // whichever reads the card first wins), or the component can unmount.
      // A late backend result must not fire a second `onScan`.
      if (disposedRef.current || pausedRef.current) return;
      // Be liberal in what we accept from the backend: extraction APIs
      // routinely return the number grouped with spaces (and `luhnCheck`
      // rejects anything non-numeric), so strip before validating rather
      // than reporting a perfectly good read as a failure.
      const number = (extracted?.number ?? "").replace(/\D/g, "");
      if (!number || !luhnCheck(number)) {
        log("external extraction — no valid number");
        consecutiveExternalFailuresRef.current += 1;
        setExternalExtractionFailed(true);
        return;
      }
      const brand = detectBrand(number);
      // Same leniency for the expiry: normalise "08/2027"-style values to
      // the documented "MM/YY", but pass through anything the normaliser
      // can't parse rather than dropping data the backend did return.
      const rawExpiry = extracted?.expiry ?? null;
      const expiry = rawExpiry ? (extractExpiry(rawExpiry) ?? rawExpiry) : null;
      pausedRef.current = true;
      setPaused(true);
      consecutiveExternalFailuresRef.current = 0;
      log("external extraction — confirmed", {
        masked: maskCardNumber(number),
        brand,
        variant: extracted?.matchedVariant,
      });
      onScanRef.current({
        number,
        formattedNumber: formatCardNumber(number, brand),
        brand,
        expiry,
        imageBase64: croppedImageBase64,
        source: "external",
        variant: extracted?.matchedVariant,
      });
    } catch (err) {
      log(
        "external extraction — error",
        err instanceof Error ? err.message : String(err)
      );
      if (!disposedRef.current && !pausedRef.current) {
        consecutiveExternalFailuresRef.current += 1;
        setExternalExtractionFailed(true);
      }
    } finally {
      externalExtractingRef.current = false;
      setExternalExtracting(false);
      lastExternalAttemptAtRef.current = performance.now();
    }
  }, [snapshot, log]);
  const handleExternalExtractionRef = useRef(handleExternalExtraction);
  handleExternalExtractionRef.current = handleExternalExtraction;

  // ── OCR scan loop ───────────────────────────────────────────────────────────
  // Attaches the shared stream to our own <video> and drives the OCR loop. The
  // manager owns the stream's lifecycle — this effect only detaches (never
  // stops) on cleanup, so a warm stream survives for the next scanner.
  useEffect(() => {
    const video = videoRef.current;
    const stream = camera.stream;
    if (!video || !stream || camera.status !== "ready") return undefined;

    let active = true;
    candidateRef.current = { number: "", count: 0 };
    recentOcrHadDigitsRef.current = false;

    video.srcObject = stream;
    void video.play().catch(() => {
      /* play() can reject if interrupted; the loop still runs once frames flow */
    });

    function scanFrame() {
      if (!active) return;
      const v = videoRef.current;
      const now = performance.now();
      if (
        v &&
        !pausedRef.current &&
        !ocrBusyRef.current &&
        now - lastOcrAtRef.current >= scanIntervalMsRef.current &&
        v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        v.videoWidth > 0
      ) {
        // Fire-and-forget: the pass clears its own busy flag when done.
        void runOcrPassRef.current();
      }

      // Card-presence probe — cheap enough to run far more often than OCR.
      // Only samples once the backend fallback is actually reachable and not
      // already in flight; drives both the auto-trigger and the visual
      // feedback on the viewfinder guide.
      if (
        v &&
        !pausedRef.current &&
        externalExtractionRef.current &&
        !externalExtractingRef.current &&
        now - lastProbeAtRef.current >= PRESENCE_SAMPLE_MS &&
        v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        v.videoWidth > 0
      ) {
        lastProbeAtRef.current = now;
        const probeCanvas = probeCanvasRef.current;
        const probe = probeCanvas
          ? probeCardPresence(v, viewfinderRef.current, probeCanvas)
          : null;
        const hasContent = probe?.stage === "content";

        // Pixel content alone is at most "probably something's there" — real
        // OCR corroboration (or, failing that, having waited long enough
        // that we stop insisting on it) is what pushes this to "confident
        // enough to spend a backend call on it". There's deliberately no
        // requirement that the frame hold still first — see the comment
        // above `probeCardPresence`.
        const ocrCorroborated = recentOcrHadDigitsRef.current;
        const eligibleForMs =
          firstEligibleAtRef.current !== null
            ? now - firstEligibleAtRef.current
            : 0;
        const ocrGateSatisfied =
          ocrCorroborated || eligibleForMs >= OCR_GATE_RELAX_AFTER_MS;
        const readyToTrigger = hasContent && ocrGateSatisfied;

        setPresenceStage(hasContent ? "detected" : "searching");

        // Throttled so it's readable rather than a flood — one line/second is
        // enough to see whether stddev/edgeEnergy are anywhere near the
        // thresholds above, which is the whole point: these were guessed, not
        // measured, so this is how they actually get tuned against real cards
        // and real cameras instead of blind re-guessing.
        if (now - lastMetricsLogAtRef.current >= 1000) {
          lastMetricsLogAtRef.current = now;
          log("presence probe", {
            probeStage: probe?.stage ?? "no-geometry",
            ocrCorroborated,
            ocrGateSatisfied,
            ...probe?.metrics,
          });
        }

        // Poll the backend on a fixed interval (with exponential backoff
        // between failures, capped) rather than waiting for any kind of
        // "settled" moment — see the comment above `probeCardPresence` for
        // why that wait was dropped.
        const cooldownMs = Math.min(
          EXTERNAL_RETRY_BASE_COOLDOWN_MS *
            2 ** consecutiveExternalFailuresRef.current,
          EXTERNAL_RETRY_MAX_COOLDOWN_MS
        );
        if (
          readyToTrigger &&
          externalArmedRef.current &&
          now - lastExternalAttemptAtRef.current >= cooldownMs
        ) {
          void handleExternalExtractionRef.current();
        }
      }

      rafRef.current = requestAnimationFrame(scanFrame);
    }
    rafRef.current = requestAnimationFrame(scanFrame);

    return () => {
      active = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Detach from this element only — the manager owns (and keeps warm) the
      // stream, so we must NOT stop its tracks here.
      video.srcObject = null;
    };
  }, [camera.stream, camera.status, log]);

  // Pill/bracket styling: searching (neutral) → card detected (amber) →
  // backend call in flight (sky). `presenceStage` only ever leaves
  // "searching" when `externalExtraction` is wired up (the probe in the scan
  // loop above is gated on it), so no extra `hasExternalExtraction` check is
  // needed here. While a call is in flight the probe is paused, so
  // `presenceStage` stays "detected" and the brackets hold amber.
  const pillText = externalExtracting
    ? resolvedLabels.extracting
    : presenceStage === "detected"
      ? resolvedLabels.cardDetected
      : resolvedLabels.scanning;
  const pillClass = externalExtracting
    ? "bg-sky-600/80"
    : presenceStage === "detected"
      ? "bg-amber-600/80"
      : "bg-black/60";
  const bracketClass =
    presenceStage === "detected" ? "border-amber-400" : "border-white";

  return (
    <CameraSurface
      camera={camera}
      videoRef={videoRef}
      testIdPrefix="credit-card-scanner"
      aspectRatio={aspectRatio}
      labels={resolvedLabels}
      showControls={!paused}
      debugLogs={debug ? debugLogs : undefined}
      onClearDebugLogs={() => setDebugLogs([])}
    >
      {/* Hidden canvases: OCR ROI + full-res capture + presence probe. */}
      <canvas ref={ocrCanvasRef} className="hidden" />
      <canvas ref={captureCanvasRef} className="hidden" />
      <canvas ref={probeCanvasRef} className="hidden" />

      {camera.status === "ready" && !paused && (
        <>
          {/* Status pill — searching, or a card-like object detected and the
              backend fallback is being tried periodically. */}
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3"
          >
            <span
              className={cn(
                "flex max-w-full items-center gap-1.5 truncate rounded-full px-3 py-1 text-xs font-medium text-white backdrop-blur-sm",
                pillClass
              )}
            >
              <Loader2Icon aria-hidden className="size-3.5 animate-spin" />
              <span className="truncate">{pillText}</span>
            </span>
          </div>

          {/* Card-shaped viewfinder (ISO ID-1 ≈ 1.586 : 1). Its rect drives
              the OCR ROI crop, so what's framed is what's read. Brackets
              track the same presence stage as the status pill above. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              ref={viewfinderRef}
              className="relative w-[82%] max-w-md overflow-hidden rounded-xl"
              style={{ aspectRatio: "1.586 / 1" }}
            >
              <span
                className={cn(
                  "absolute left-0 top-0 h-6 w-6 rounded-tl-md border-l-2 border-t-2",
                  bracketClass
                )}
              />
              <span
                className={cn(
                  "absolute right-0 top-0 h-6 w-6 rounded-tr-md border-r-2 border-t-2",
                  bracketClass
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-6 w-6 rounded-bl-md border-b-2 border-l-2",
                  bracketClass
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-6 w-6 rounded-br-md border-b-2 border-r-2",
                  bracketClass
                )}
              />
              {/* Number-band guide: a subtle line where the PAN usually sits. */}
              <span className="absolute inset-x-4 top-[58%] h-px bg-white/40" />
              <span className="absolute inset-x-2.5 h-px animate-[scan_2s_linear_infinite] bg-white/60" />
            </div>
          </div>

          {/* Transient failure message after an auto-triggered attempt comes
              back empty — clears itself on the next attempt (see
              `handleExternalExtraction`). Only reachable once
              `externalExtractionAfterMs` has elapsed. */}
          {hasExternalExtraction && externalArmed && externalExtractionFailed && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-3"
            >
              <span className="max-w-full truncate rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                {resolvedLabels.extractionFailed}
              </span>
            </div>
          )}
        </>
      )}

      {camera.status === "ready" && paused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-white">
          <CheckCircle2Icon aria-hidden className="size-8 text-emerald-400" />
          <p className="text-sm font-medium">{resolvedLabels.captured}</p>
          <Button
            data-testid="credit-card-scanner-scan-again"
            variant="secondary"
            size="sm"
            onClick={handleScanAgain}
          >
            <RotateCcwIcon aria-hidden className="size-4" />
            {resolvedLabels.scanAgain}
          </Button>
        </div>
      )}
    </CameraSurface>
  );
}

export * from "./demo";
