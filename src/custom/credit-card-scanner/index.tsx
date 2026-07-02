"use client";

import {
  Button,
  buttonVariants,
} from "@repo/ayasofyazilim-ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/ayasofyazilim-ui/components/select";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  CheckCircle2Icon,
  FlashlightIcon,
  FlashlightOffIcon,
  Loader2Icon,
  RotateCcwIcon,
  SwitchCameraIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type CardBrand,
  detectBrand,
  extractExpiry,
  formatCardNumber,
  extractCardNumber,
  maskCardNumber,
} from "./lib";
import { readCardText } from "./ocr";

// ── Extended MediaTrack camera controls ──────────────────────────────────────
// `focusMode` and `torch` are real, widely-shipped camera capabilities that the
// standard DOM lib types don't yet model. We read/apply them through these
// narrow extensions, always capability-gated and wrapped in try/catch.
interface ExtendedTrackCapabilities extends MediaTrackCapabilities {
  focusMode?: string[];
  torch?: boolean;
}
interface ExtendedConstraintSet {
  focusMode?: string;
  torch?: boolean;
}

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
    const g = ((d[i] ?? 0) * 299 + (d[i + 1] ?? 0) * 587 + (d[i + 2] ?? 0) * 114) / 1000;
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

// ── Camera metadata ───────────────────────────────────────────────────────────

interface CameraInfo {
  deviceId: string;
  rawLabel: string;
  facingMode: "environment" | "user" | undefined;
}

function inferFacingFromLabel(
  label: string
): "environment" | "user" | undefined {
  const l = label.toLowerCase();
  if (l.includes("back") || l.includes("rear") || l.includes("environment"))
    return "environment";
  if (l.includes("front") || l.includes("user") || l.includes("selfie"))
    return "user";
  return undefined;
}

function cameraDisplayLabel(
  cam: CameraInfo,
  index: number,
  labels: Required<CreditCardScannerLabels>
): string {
  if (cam.facingMode === "environment") return labels.backCamera;
  if (cam.facingMode === "user") return labels.frontCamera;
  if (cam.rawLabel) return cam.rawLabel;
  return `${labels.camera} ${index + 1}`;
}

// getUserMedia error names meaning the *stored* camera no longer matches a
// usable device — forget the saved selection and fall back to the default.
const STALE_DEVICE_ERRORS = new Set([
  "OverconstrainedError",
  "NotFoundError",
  "DevicesNotFoundError",
]);
// Error names meaning the camera is momentarily busy (another scanner still
// releasing it, or another tab holds it) — worth a brief automatic retry.
const CAMERA_BUSY_ERRORS = new Set([
  "NotReadableError",
  "AbortError",
  "TrackStartError",
]);
const MAX_CAMERA_BUSY_RETRIES = 2;

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

type ScannerStatus = "requesting" | "ready" | "denied" | "no-camera";

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
  const streamRef = useRef<MediaStream | null>(null);
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
  const activeCameraIdRef = useRef<string | undefined>(undefined);

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

  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [activeStreamDeviceId, setActiveStreamDeviceId] = useState<
    string | undefined
  >(undefined);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(
    () => {
      if (typeof window === "undefined") return undefined;
      try {
        return localStorage.getItem("credit-card-scanner-camera-id") ?? undefined;
      } catch {
        return undefined;
      }
    }
  );
  const [status, setStatus] = useState<ScannerStatus>("requesting");
  const [paused, setPaused] = useState(false);

  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const torchOnRef = useRef(false);

  // Bumped by the retry button to re-run the camera effect after a failure.
  const [retryNonce, setRetryNonce] = useState(0);
  const handleRetry = useCallback(() => {
    setStatus("requesting");
    setRetryNonce((n) => n + 1);
  }, []);

  const handleTorchToggle = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOnRef.current;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as ExtendedConstraintSet],
      } as MediaTrackConstraints);
      torchOnRef.current = next;
      setTorchOn(next);
    } catch {
      /* torch unsupported on this track — ignore */
    }
  }, []);

  const handleCameraChange = useCallback((deviceId: string) => {
    setSelectedCameraId(deviceId);
    try {
      localStorage.setItem("credit-card-scanner-camera-id", deviceId);
    } catch {
      // localStorage may be unavailable (private browsing, etc.)
    }
  }, []);

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

  // ── Camera open + OCR scan loop ─────────────────────────────────────────────
  // useEffect is the right tool here: it subscribes to an external resource
  // (the camera MediaStream) and drives a requestAnimationFrame loop.
  useEffect(() => {
    setStatus("requesting");
    setTorchSupported(false);
    setTorchOn(false);
    torchOnRef.current = false;
    candidateRef.current = { number: "", count: 0 };
    let active = true;
    const videoEl = videoRef.current;

    void (async () => {
      try {
        streamRef.current?.getTracks().forEach((tr) => tr.stop());

        if (!navigator.mediaDevices?.getUserMedia) {
          log("getUserMedia unavailable — insecure context or unsupported");
          setStatus("denied");
          return;
        }

        const baseVideo: MediaTrackConstraints = {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        };
        const videoConstraints = (deviceId?: string): MediaTrackConstraints =>
          deviceId
            ? { ...baseVideo, deviceId: { exact: deviceId } }
            : { ...baseVideo, facingMode: { ideal: "environment" } };

        // Acquire resiliently: heal a stale stored selection, and ride out a
        // camera that's momentarily busy (another scanner still releasing it).
        const acquireStream = async (): Promise<MediaStream> => {
          let useDeviceId = selectedCameraId;
          for (let attempt = 0; ; attempt++) {
            try {
              return await navigator.mediaDevices.getUserMedia({
                video: videoConstraints(useDeviceId),
              });
            } catch (err) {
              const name = (err as { name?: string }).name ?? "";
              if (useDeviceId && STALE_DEVICE_ERRORS.has(name)) {
                log("stored camera unusable — falling back to default", {
                  name,
                });
                try {
                  localStorage.removeItem("credit-card-scanner-camera-id");
                } catch {
                  /* localStorage may be unavailable */
                }
                useDeviceId = undefined;
                continue;
              }
              if (
                CAMERA_BUSY_ERRORS.has(name) &&
                attempt < MAX_CAMERA_BUSY_RETRIES &&
                active
              ) {
                log("camera busy — retrying shortly", { attempt, name });
                await new Promise((resolve) => {
                  setTimeout(resolve, 400);
                });
                if (!active) throw err;
                continue;
              }
              throw err;
            }
          }
        };

        const stream = await acquireStream();

        if (!active || !videoRef.current) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;

        const activeTrack = stream.getVideoTracks()[0];
        const trackSettings = activeTrack?.getSettings();
        const activeFacingMode = trackSettings?.facingMode as
          | "environment"
          | "user"
          | undefined;
        const activeDeviceId = trackSettings?.deviceId;
        activeCameraIdRef.current = activeDeviceId;
        setActiveStreamDeviceId(activeDeviceId);
        log("camera stream opened", {
          deviceId: activeDeviceId,
          facingMode: activeFacingMode,
        });

        // Continuous autofocus is the #1 win for reading small card digits.
        // Both calls are capability-gated and non-fatal.
        if (activeTrack) {
          try {
            const caps = activeTrack.getCapabilities?.() as
              | ExtendedTrackCapabilities
              | undefined;
            if (caps?.focusMode?.includes("continuous")) {
              await activeTrack.applyConstraints({
                advanced: [
                  { focusMode: "continuous" } as ExtendedConstraintSet,
                ],
              } as MediaTrackConstraints);
            }
            if (caps?.torch) setTorchSupported(true);
          } catch {
            /* focus/torch setup skipped (constraint unsupported) */
          }
        }

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        if (!active) return;
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        const enriched: CameraInfo[] = videoDevices.map((d) => ({
          deviceId: d.deviceId,
          rawLabel: d.label,
          facingMode:
            d.deviceId === activeDeviceId
              ? activeFacingMode
              : inferFacingFromLabel(d.label),
        }));
        setCameras(enriched);

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (!active) return;
        setStatus("ready");

        function scanFrame() {
          if (!active) return;
          const video = videoRef.current;
          const now = performance.now();
          if (
            video &&
            !pausedRef.current &&
            !ocrBusyRef.current &&
            now - lastOcrAtRef.current >= scanIntervalMsRef.current &&
            video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            video.videoWidth > 0
          ) {
            // Fire-and-forget: the pass clears its own busy flag when done.
            void runOcrPassRef.current();
          }
          rafRef.current = requestAnimationFrame(scanFrame);
        }
        rafRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        if (!active) return;
        const name = (err as { name?: string }).name ?? "";
        log("camera init failed", { name });
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setStatus("no-camera");
        } else {
          setStatus("denied");
        }
      }
    })();

    return () => {
      active = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      if (videoEl) videoEl.srcObject = null;
    };
    // Intentional triggers only: selectedCameraId (user picks a camera) and
    // retryNonce (user taps "try again"). Everything else the loop needs is
    // read through a ref so the stream isn't torn down on unrelated changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCameraId, retryNonce]);

  const selectValue =
    selectedCameraId ?? activeStreamDeviceId ?? cameras[0]?.deviceId;

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="relative bg-black" style={{ aspectRatio }}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {/* Hidden canvases: OCR ROI + full-res capture. */}
        <canvas ref={ocrCanvasRef} className="hidden" />
        <canvas ref={captureCanvasRef} className="hidden" />

        {status === "requesting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white">
            <Loader2Icon className="size-6 animate-spin" />
            <p className="text-sm">{resolvedLabels.requesting}</p>
          </div>
        )}

        {(status === "denied" || status === "no-camera") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-4 text-center text-sm text-white">
            <p>
              {status === "denied"
                ? resolvedLabels.permissionDenied
                : resolvedLabels.noCamera}
            </p>
            <button
              type="button"
              data-testid="credit-card-scanner-retry"
              onClick={handleRetry}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              )}
            >
              <RotateCcwIcon className="size-4" />
              {resolvedLabels.retry}
            </button>
          </div>
        )}

        {status === "ready" && !paused && (
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

        {status === "ready" && paused && (
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

        {status === "ready" && !paused && torchSupported && (
          <div className="absolute bottom-4 left-4 z-10">
            <button
              type="button"
              data-testid="credit-card-scanner-torch"
              aria-label={resolvedLabels.torch}
              aria-pressed={torchOn}
              onClick={() => void handleTorchToggle()}
              className={cn(
                buttonVariants({ size: "icon-xs", variant: "outline" }),
                "aspect-square max-h-7 rounded-full border-white/20 backdrop-blur-sm",
                torchOn
                  ? "bg-white text-black hover:bg-white"
                  : "bg-black/60 text-white"
              )}
            >
              {torchOn ? <FlashlightIcon /> : <FlashlightOffIcon />}
            </button>
          </div>
        )}

        {status === "ready" && !paused && cameras.length > 1 && (
          <div className="absolute bottom-4 right-4 z-10">
            <Select value={selectValue} onValueChange={handleCameraChange}>
              <SelectTrigger
                data-testid="credit-card-scanner-select"
                className={cn(
                  buttonVariants({ size: "icon-xs", variant: "outline" }),
                  "aspect-square max-h-7 rounded-full border-white/20 bg-black/60 backdrop-blur-sm [&>.lucide-chevron-down]:hidden"
                )}
              >
                <SwitchCameraIcon />
              </SelectTrigger>
              <SelectContent align="end">
                {cameras.map((cam, i) => (
                  <SelectItem key={cam.deviceId} value={cam.deviceId}>
                    {cameraDisplayLabel(cam, i, resolvedLabels)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* On-screen debug log — visible on devices with no console. */}
        {debug && (
          <div className="absolute inset-x-0 top-0 z-30 max-h-[55%] overflow-y-auto bg-black/40 p-2 pt-0 font-mono text-[10px] leading-snug text-emerald-300">
            <div className="sticky top-0 -mx-2 -mt-2 mb-1 flex items-center justify-between bg-black/50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-400/90">
              <span>Scanner debug · {debugLogs.length}</span>
              <button
                type="button"
                data-testid="credit-card-scanner-debug-clear"
                className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-200"
                onClick={() => setDebugLogs([])}
              >
                clear
              </button>
            </div>
            {debugLogs.length === 0 ? (
              <div className="text-emerald-300/60">Waiting for events…</div>
            ) : (
              debugLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="break-all border-b border-white/5 py-0.5"
                >
                  <span className="text-emerald-500/70">{entry.time}</span>{" "}
                  <span className="text-white">{entry.message}</span>
                  {entry.data ? (
                    <span className="text-emerald-300/80"> {entry.data}</span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export * from "./demo";
