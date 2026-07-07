"use client";

import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { CheckCircle2Icon, Loader2Icon, RotateCcwIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraSurface, useCameraStream } from "../camera-stream";
import {
  type CardBrand,
  detectBrand,
  extractExpiry,
  formatCardNumber,
  extractCardNumber,
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

/**
 * Draw the viewfinder ROI (or the whole frame, until geometry is ready) into
 * `canvas`, capped to `MAX_OCR_WIDTH`, then convert it to grayscale with a
 * min–max contrast stretch. High-contrast monochrome is what Tesseract reads
 * best — it lifts faint flat-printed digits off a busy card background. Returns
 * null when there's nothing to draw.
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

  // Grayscale + contrast stretch.
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
  return canvas;
}

// ── Public API ────────────────────────────────────────────────────────────────

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
  /** JPEG quality for the captured image, 0–1. @default 0.92 */
  imageQuality?: number;
  /**
   * Aspect ratio of the camera viewport, as any valid CSS `aspect-ratio` value.
   * @default "16 / 10"
   */
  aspectRatio?: string;
  /** Logs scan-lifecycle events (card numbers masked) to an on-screen overlay + console. @default false */
  debug?: boolean;
  labels?: CreditCardScannerLabels;
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
};

export function CreditCardScanner({
  onScan,
  scanIntervalMs = 600,
  requiredMatches = 2,
  imageQuality = 0.92,
  aspectRatio = "16 / 10",
  debug = false,
  labels,
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

  const resetScanState = useCallback(() => {
    candidateRef.current = { number: "", count: 0 };
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
  }, [resetScanState]);

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
  }, [camera.stream, camera.status]);

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
      {/* Hidden canvases: OCR ROI + full-res capture. */}
      <canvas ref={ocrCanvasRef} className="hidden" />
      <canvas ref={captureCanvasRef} className="hidden" />

      {camera.status === "ready" && !paused && (
        <>
          {/* Status pill — a calm, persistent "scanning" state. */}
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3">
            <span className="flex max-w-full items-center gap-1.5 truncate rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Loader2Icon className="size-3.5 animate-spin" />
              <span className="truncate">{resolvedLabels.scanning}</span>
            </span>
          </div>

          {/* Card-shaped viewfinder (ISO ID-1 ≈ 1.586 : 1). Its rect drives
              the OCR ROI crop, so what's framed is what's read. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              ref={viewfinderRef}
              className="relative w-[82%] max-w-md overflow-hidden rounded-xl"
              style={{ aspectRatio: "1.586 / 1" }}
            >
              <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-md border-l-2 border-t-2 border-white" />
              <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-md border-r-2 border-t-2 border-white" />
              <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-md border-b-2 border-l-2 border-white" />
              <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-md border-b-2 border-r-2 border-white" />
              {/* Number-band guide: a subtle line where the PAN usually sits. */}
              <span className="absolute inset-x-4 top-[58%] h-px bg-white/40" />
              <span className="absolute inset-x-2.5 h-px animate-[scan_2s_linear_infinite] bg-white/60" />
            </div>
          </div>
        </>
      )}

      {camera.status === "ready" && paused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-white">
          <CheckCircle2Icon className="size-8 text-emerald-400" />
          <p className="text-sm font-medium">{resolvedLabels.captured}</p>
          <Button
            data-testid="credit-card-scanner-scan-again"
            variant="secondary"
            size="sm"
            onClick={handleScanAgain}
          >
            <RotateCcwIcon className="size-4" />
            {resolvedLabels.scanAgain}
          </Button>
        </div>
      )}
    </CameraSurface>
  );
}

export * from "./demo";
