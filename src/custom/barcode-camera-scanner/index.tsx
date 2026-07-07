"use client";

import { buttonVariants } from "@repo/ayasofyazilim-ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/ayasofyazilim-ui/components/select";
import { toast } from "@repo/ayasofyazilim-ui/components/sonner";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import {
  FlashlightIcon,
  FlashlightOffIcon,
  Loader2Icon,
  RotateCcwIcon,
  SwitchCameraIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── W3C Barcode Detection API types (Chrome/Edge/Safari 17+) ─────────────────
interface BarcodeDetectorResult {
  rawValue: string;
  format: string;
}
interface BarcodeDetectorCtor {
  new (options?: { formats: string[] }): {
    detect(
      source: HTMLVideoElement | HTMLCanvasElement
    ): Promise<BarcodeDetectorResult[]>;
  };
  getSupportedFormats(): Promise<string[]>;
}

// ── Extended MediaTrack camera controls ──────────────────────────────────────
// `focusMode`, `torch`, and `zoom` are real, widely-shipped camera capabilities
// that the standard DOM lib types don't yet model. We read/apply them through
// these narrow extensions, always capability-gated and wrapped in try/catch.
interface ExtendedTrackCapabilities extends MediaTrackCapabilities {
  focusMode?: string[];
  torch?: boolean;
}
interface ExtendedConstraintSet {
  focusMode?: string;
  torch?: boolean;
}

/**
 * Barcode formats the scanner can recognise. Names follow the W3C Barcode
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
const FORMAT_TO_ZXING: Record<BarcodeFormatName, BarcodeFormat> = {
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

// Every supported format — the default set when the caller doesn't restrict it.
const ALL_BARCODE_FORMATS = Object.keys(FORMAT_TO_ZXING) as BarcodeFormatName[];

// 1-D linear symbologies — tall, narrow bars read by a single horizontal beam.
const LINEAR_1D_FORMATS: BarcodeFormatName[] = [
  "code_128",
  "code_39",
  "code_93",
  "ean_13",
  "ean_8",
  "itf",
  "upc_a",
  "upc_e",
];
// Square 2-D matrix symbologies.
const SQUARE_2D_FORMATS: BarcodeFormatName[] = [
  "qr_code",
  "data_matrix",
  "aztec",
];

/**
 * Viewfinder shape that best matches the active format set, so the scanner
 * overlay reflects what's actually being scanned:
 *  - "square" → QR / Data Matrix / Aztec
 *  - "linear" → 1-D barcodes (a short, wide strip with a single steady beam)
 *  - "wide"   → PDF417 boarding passes, or any mixed / unrestricted set
 */
type ScanShape = "square" | "linear" | "wide";

function getScanShape(formats: BarcodeFormatName[]): ScanShape {
  if (formats.length === 0) return "wide";
  if (formats.every((f) => SQUARE_2D_FORMATS.includes(f))) return "square";
  if (formats.every((f) => LINEAR_1D_FORMATS.includes(f))) return "linear";
  return "wide";
}

// Frame dimensions per shape — the aspect ratio is the main visual cue.
const VIEWFINDER_BY_SHAPE: Record<ScanShape, string> = {
  square: "h-52 w-52",
  linear: "h-20 w-80",
  wide: "h-36 w-80",
};

// ZXing software decode is CPU-heavy — throttle to ~8 fps.
const ZXING_SCAN_INTERVAL_MS = 50;

// Decode only the viewfinder region instead of the whole frame. This keeps the
// barcode at near-native resolution (rather than downscaling the entire frame
// and blurring narrow 1-D bars together) and strips background noise that
// causes misses and false reads. The ROI is grown by this fraction on each side
// so a barcode that isn't perfectly centred in the guide still decodes.
const ROI_PADDING = 0.25;
// Cap the decode canvas width. Because the ROI is already a fraction of the
// frame, this higher cap (vs. a full-frame decode) preserves detail on dense
// 1-D bars while still bounding per-frame CPU cost.
const MAX_DECODE_WIDTH = 1024;

// Directional symbologies — PDF417 (boarding passes) and every 1-D barcode —
// encode along a single axis and, unlike QR / Data Matrix / Aztec, don't
// self-orient. A code held sideways or upside-down therefore never decodes from
// the upright frame alone. When such a format is in play we retry the frame
// rotated: 0° is always attempted first (the common case), then these
// orientations are cycled one per frame so the extra decode cost stays bounded
// while a rotated code still resolves within a few frames.
const ROTATED_ORIENTATIONS = [90, 270, 180] as const;

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
  // Top-left of the (overflowing) video content relative to the element box.
  const contentLeft = (videoRect.width - vw * scale) / 2;
  const contentTop = (videoRect.height - vh * scale) / 2;
  // Map the viewfinder box from CSS px → intrinsic px.
  let sx = (vfRect.left - videoRect.left - contentLeft) / scale;
  let sy = (vfRect.top - videoRect.top - contentTop) / scale;
  let sw = vfRect.width / scale;
  let sh = vfRect.height / scale;
  // Grow by padding and clamp to the frame bounds.
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
 * `canvas` at a capped resolution and return it to decode from. Returns null
 * only when there's nothing to draw.
 */
function drawDecodeFrame(
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
  const scale = Math.min(1, MAX_DECODE_WIDTH / sw);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  if (canvas.width !== dw || canvas.height !== dh) {
    canvas.width = dw;
    canvas.height = dh;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh);
  return canvas;
}

/**
 * Draw `source` rotated clockwise by `deg` (90/180/270) into `dest` and return
 * it, so the decoders can retry a sideways or upside-down frame. 90°/270° swap
 * width and height. `dest` is a reusable scratch canvas: because both decode
 * paths finish reading one orientation before requesting the next, a single
 * scratch canvas is safe to share across orientations.
 */
function drawRotatedFrame(
  source: HTMLCanvasElement,
  deg: 90 | 180 | 270,
  dest: HTMLCanvasElement
): HTMLCanvasElement | null {
  const sw = source.width;
  const sh = source.height;
  if (!sw || !sh) return null;
  const swap = deg === 90 || deg === 270;
  const dw = swap ? sh : sw;
  const dh = swap ? sw : sh;
  if (dest.width !== dw || dest.height !== dh) {
    dest.width = dw;
    dest.height = dh;
  }
  const ctx = dest.getContext("2d");
  if (!ctx) return null;
  ctx.save();
  ctx.translate(dw / 2, dh / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(source, -sw / 2, -sh / 2);
  ctx.restore();
  return dest;
}

// ── Camera metadata ───────────────────────────────────────────────────────────

interface CameraInfo {
  deviceId: string;
  /** OS-supplied raw label */
  rawLabel: string;
  /** Resolved from stream track settings, or inferred from the OS label */
  facingMode: "environment" | "user" | undefined;
}

/** Try to infer facing mode from the OS-supplied label string. */
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

/** Return the human-readable camera name shown in the selector. */
function cameraDisplayLabel(
  cam: CameraInfo,
  index: number,
  labels: Required<BarcodeCameraLabels>
): string {
  if (cam.facingMode === "environment") return labels.backCamera;
  if (cam.facingMode === "user") return labels.frontCamera;
  if (cam.rawLabel) return cam.rawLabel;
  return `${labels.camera} ${index + 1}`;
}

// getUserMedia error names meaning the *stored* camera no longer matches a
// usable device — we forget the saved selection and fall back to the default
// camera instead of failing. (When no stored id was used, these instead mean
// "no camera", handled separately.)
const STALE_DEVICE_ERRORS = new Set([
  "OverconstrainedError",
  "NotFoundError",
  "DevicesNotFoundError",
]);
// Error names meaning the camera is momentarily busy — typically another
// scanner (e.g. the passport/MRZ scanner) is still releasing it, or another
// browser tab/app holds it. Worth a brief automatic retry.
const CAMERA_BUSY_ERRORS = new Set([
  "NotReadableError",
  "AbortError",
  "TrackStartError",
]);
const MAX_CAMERA_BUSY_RETRIES = 2;

// ── Public API ────────────────────────────────────────────────────────────────

export interface BarcodeCameraLabels {
  /** Overlay shown while requesting camera permission. */
  requesting?: string;
  /** Overlay shown when permission was denied. */
  permissionDenied?: string;
  /** Overlay shown when no camera is found. */
  noCamera?: string;
  /** Placeholder for the camera-selector dropdown. */
  selectCamera?: string;
  /** Display name for the rear/environment-facing camera. */
  backCamera?: string;
  /** Display name for the front/user-facing camera. */
  frontCamera?: string;
  /** Generic camera label prefix when facing mode is unknown. */
  camera?: string;
  /** Accessible label for the torch / flashlight toggle button. */
  torch?: string;
  /** Label for the button that re-requests camera access after a failure. */
  retry?: string;
}

export interface BarcodeCameraScannerProps {
  onScan: (code: string) => void;
  /**
   * Milliseconds to suppress the same barcode value from being reported again.
   * Set to 0 to disable (component will stop scanning after the first result).
   * @default 2000
   */
  scanCooldownMs?: number;
  /**
   * Restrict scanning to these barcode formats. Narrowing the set speeds up
   * decoding and avoids false positives from unrelated symbologies. When
   * omitted or empty, every supported format is scanned (the default).
   *
   * Note: this is read when the camera stream opens. Changing it restarts the
   * stream so the new format set takes effect.
   */
  formats?: BarcodeFormatName[];
  /**
   * Logs scan-lifecycle events to the console (prefixed "[BarcodeScanner]"):
   * camera open, chosen decode path, periodic loop heartbeats, decoded values,
   * and init errors. Use it to diagnose why scanning isn't starting. Leave off
   * in production.
   * @default false
   */
  debug?: boolean;
  /**
   * Aspect ratio of the camera viewport, as any valid CSS `aspect-ratio`
   * value (e.g. "1 / 1", "16 / 9", "4 / 3", "3 / 4" for portrait). Applied via
   * inline style so any ratio works without Tailwind safelisting.
   * @default "1 / 1"
   */
  aspectRatio?: string;
  labels?: BarcodeCameraLabels;
}

type ScannerStatus = "requesting" | "ready" | "denied" | "no-camera";

const DEFAULT_LABELS: Required<BarcodeCameraLabels> = {
  requesting: "Requesting camera access…",
  permissionDenied:
    "Camera access was denied. Please allow camera access and reload.",
  noCamera: "No camera found on this device.",
  selectCamera: "Select camera",
  backCamera: "Back Camera",
  frontCamera: "Front Camera",
  camera: "Camera",
  torch: "Toggle flashlight",
  retry: "Try again",
};

export function BarcodeCameraScanner({
  onScan,
  scanCooldownMs = 2000,
  formats,
  debug = false,
  aspectRatio = "1 / 1",
  labels,
}: BarcodeCameraScannerProps) {
  const resolvedLabels = useMemo<Required<BarcodeCameraLabels>>(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels]
  );

  const resolvedFormats = useMemo<BarcodeFormatName[]>(
    () => (formats && formats.length > 0 ? formats : ALL_BARCODE_FORMATS),
    [formats]
  );
  // Stable primitive key: an inline `formats` array gets a new reference on
  // every render, but its contents rarely change — keying the scan effect on
  // the joined string avoids needlessly reopening the camera.
  const formatsKey = resolvedFormats.join(",");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The on-screen viewfinder box — its rect drives the decode ROI crop.
  const viewfinderRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  // Tracks the deviceId of the currently open stream — stored as a ref so
  // updating it after auto-selecting the environment camera does NOT re-trigger
  // the effect (which would cause a double-open on every mount).
  const activeCameraIdRef = useRef<string | undefined>(undefined);

  // Cooldown: suppress repeated reports of the same barcode value.
  const lastScanRef = useRef<{ value: string; time: number }>({
    value: "",
    time: 0,
  });

  // Debug logging, gated by the `debug` prop. Read through a ref so toggling
  // debug never restarts the camera effect.
  const debugRef = useRef(debug);
  debugRef.current = debug;
  // On-screen log buffer (newest first) rendered as an overlay when `debug` is
  // on — for devices with no visible console (e.g. iPad / mobile Safari).
  const [debugLogs, setDebugLogs] = useState<
    { id: number; time: string; message: string; data?: string }[]
  >([]);
  const logSeqRef = useRef(0);
  const log = useCallback((message: string, data?: unknown) => {
    if (!debugRef.current) return;
    if (data !== undefined) {
      console.log(`[BarcodeScanner] ${message}`, data);
    } else {
      console.log(`[BarcodeScanner] ${message}`);
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
  // Reactive mirror of activeCameraIdRef for correct select display.
  const [activeStreamDeviceId, setActiveStreamDeviceId] = useState<
    string | undefined
  >(undefined);
  // undefined = no explicit user selection yet (environment camera opened by default).
  // Initialised from localStorage so the last-used camera is restored on mount.
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(
    () => {
      if (typeof window === "undefined") return undefined;
      try {
        return localStorage.getItem("barcode-scanner-camera-id") ?? undefined;
      } catch {
        return undefined;
      }
    }
  );
  const [status, setStatus] = useState<ScannerStatus>("requesting");

  // Bumped by the retry button to re-run the camera effect after a failure
  // (denied permission or no camera) without remounting the component.
  const [retryNonce, setRetryNonce] = useState(0);
  const handleRetry = useCallback(() => {
    setStatus("requesting");
    setRetryNonce((n) => n + 1);
  }, []);

  // Torch / flashlight: only exposed when the active camera reports the
  // capability. `torchOnRef` mirrors state so the toggle handler stays stable.
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const torchOnRef = useRef(false);

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
      log("torch toggled", next);
    } catch {
      log("torch toggle failed");
    }
    // log is stable; intentionally omitted to keep this callback stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCameraChange = useCallback((deviceId: string) => {
    setSelectedCameraId(deviceId);
    try {
      localStorage.setItem("barcode-scanner-camera-id", deviceId);
    } catch {
      // localStorage may be unavailable (private browsing, etc.)
    }
  }, []);

  const reportScan = useCallback(
    (value: string) => {
      if (scanCooldownMs > 0) {
        const now = Date.now();
        if (
          value === lastScanRef.current.value &&
          now - lastScanRef.current.time < scanCooldownMs
        ) {
          log("scan suppressed by cooldown", value);
          return;
        }
        lastScanRef.current = { value, time: now };
      }
      log("scan reported to onScan", value);
      onScanRef.current(value);
    },
    [scanCooldownMs, log]
  );

  useEffect(() => {
    setStatus("requesting");
    // Torch belongs to the previous stream — reset before opening a new one.
    setTorchSupported(false);
    setTorchOn(false);
    torchOnRef.current = false;
    log("requesting camera access", {
      camera: selectedCameraId ?? "(default / environment-facing)",
      formats: resolvedFormats,
    });
    let active = true;
    let restoreConsole: (() => void) | null = null;
    const videoEl = videoRef.current;

    void (async () => {
      try {
        // Stop any previous stream before opening a new one.
        streamRef.current?.getTracks().forEach((tr) => tr.stop());

        // Camera needs a secure context (HTTPS or localhost); bail clearly if
        // the API isn't even present rather than throwing a vague TypeError.
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
            : // Prefer the rear camera on mobile for barcode scanning.
              { ...baseVideo, facingMode: { ideal: "environment" } };

        // Acquire the camera resiliently: heal a stale stored selection by
        // falling back to the default camera, and ride out a camera that's
        // momentarily busy (e.g. another scanner still releasing it).
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
                  localStorage.removeItem("barcode-scanner-camera-id");
                } catch {
                  /* localStorage may be unavailable (private browsing, etc.) */
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

        // ── Determine the facing mode of the opened camera ──────────────────
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
          width: trackSettings?.width,
          height: trackSettings?.height,
        });

        // ── Camera controls: continuous autofocus + torch ──────────────────
        // Out-of-focus close-ups are the #1 reason 1-D barcodes fail to scan,
        // so request continuous AF when the device supports it. Both calls are
        // capability-gated and non-fatal: unsupported browsers just skip them.
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
              log("continuous autofocus applied");
            }
            if (caps?.torch) {
              setTorchSupported(true);
              log("torch capability detected");
            }
          } catch {
            log("focus/torch setup skipped (constraint unsupported)");
          }
        }

        // ── Enumerate cameras and enrich with facing info ───────────────────
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
        log("cameras enumerated", { count: enriched.length });

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (!active) return;
        setStatus("ready");
        log("video playing — status ready", {
          readyState: videoRef.current.readyState,
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
        });

        // ── Barcode detection ───────────────────────────────────────────────

        // Only sweep rotated orientations when a directional format (PDF417 or
        // any 1-D) is present — QR / Data Matrix / Aztec already decode at any
        // rotation, so the retry would be wasted CPU for a pure-2-D set.
        const tryRotations = resolvedFormats.some(
          (f) => !SQUARE_2D_FORMATS.includes(f)
        );

        const BDCtor =
          typeof window !== "undefined" && "BarcodeDetector" in window
            ? (window as unknown as { BarcodeDetector: BarcodeDetectorCtor })
                .BarcodeDetector
            : null;

        if (BDCtor) {
          // ── Native path (Chrome/Edge/Safari 17+) ────────────────────────
          log("decode path: native BarcodeDetector");
          let nativeFormats: string[] = resolvedFormats;
          let supportedFormats: string[] | null = null;
          try {
            const supported = await BDCtor.getSupportedFormats();
            supportedFormats = supported;
            const supportedSet = new Set(supported);
            const filtered = resolvedFormats.filter((f) => supportedSet.has(f));
            if (filtered.length > 0) nativeFormats = filtered;
          } catch {
            /* this browser couldn't report support — try the requested set */
          }
          log("native formats resolved", {
            requested: resolvedFormats,
            supported: supportedFormats,
            using: nativeFormats,
          });

          const detector = new BDCtor({ formats: nativeFormats });
          // Guard: don't stack async detect() calls if one is still pending.
          let isDetecting = false;
          // Scratch canvas + round-robin cursor for the rotated-retry sweep.
          const rotationCanvas = document.createElement("canvas");
          let rotationIdx = 0;
          // Debug-only counters powering the heartbeat log.
          let frameCount = 0;
          let detectCount = 0;
          let lastHeartbeat = 0;

          async function scanFrameNative() {
            if (!active || !videoRef.current) return;
            const video = videoRef.current;
            frameCount++;
            if (
              !isDetecting &&
              video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
            ) {
              isDetecting = true;
              detectCount++;
              try {
                // Detect on the cropped viewfinder ROI (falls back to the full
                // video element until the overlay geometry is measurable).
                const canvas = canvasRef.current;
                const roi =
                  canvas &&
                  drawDecodeFrame(video, viewfinderRef.current, canvas);
                const source = roi || video;
                let hit = (await detector.detect(source))[0] ?? null;
                // Upright miss: retry one rotated orientation (round-robin) so a
                // sideways / upside-down PDF417 or 1-D code still decodes. Needs
                // the ROI canvas — skip while still falling back to raw video.
                if (!hit && tryRotations && roi) {
                  const deg = ROTATED_ORIENTATIONS[rotationIdx];
                  rotationIdx = (rotationIdx + 1) % ROTATED_ORIENTATIONS.length;
                  const rotated =
                    deg && drawRotatedFrame(roi, deg, rotationCanvas);
                  if (rotated) {
                    const r = (await detector.detect(rotated))[0];
                    if (r) {
                      hit = r;
                      log("native hit on rotated frame", { deg });
                    }
                  }
                }
                if (hit) {
                  log("native barcode detected", {
                    format: hit.format,
                    value: hit.rawValue,
                  });
                  reportScan(hit.rawValue);
                }
              } catch {
                /* skip: thrown when video isn't ready */
              } finally {
                isDetecting = false;
              }
            }
            if (debugRef.current) {
              const now = performance.now();
              if (now - lastHeartbeat > 2000) {
                lastHeartbeat = now;
                log("native scanning…", {
                  frames: frameCount,
                  detectAttempts: detectCount,
                  readyState: video.readyState,
                  videoWidth: video.videoWidth,
                });
              }
            }
            if (active)
              rafRef.current = requestAnimationFrame(
                () => void scanFrameNative()
              );
          }
          log("native scan loop started");
          rafRef.current = requestAnimationFrame(() => void scanFrameNative());
        } else {
          // ── ZXing software fallback ─────────────────────────────────────
          log("decode path: ZXing fallback (BarcodeDetector unavailable)");
          const canvas = canvasRef.current;
          if (!canvas || !videoRef.current) {
            log("ZXing setup aborted — canvas or video element missing");
            return;
          }

          // Suppress noisy ZXing internal log lines.
          // ZXing browser library uses the "[browser]" prefix; the core
          // ZXing emits expected per-frame noise via console.log, console.warn,
          // and console.error (NotFoundException, FormatException, "Could not
          // create a Canvas element", etc.). Suppress all of them while the
          // scanner is active; restore originals on cleanup.
          const origLog = console.log;
          const origWarn = console.warn;
          const origError = console.error;
          const ZXING_PREFIXES = ["[browser]", "MultiFormatReader:"];
          const isZXingNoise = (args: unknown[]) =>
            typeof args[0] === "string" &&
            ZXING_PREFIXES.some((p) => (args[0] as string).startsWith(p));
          console.log = (...args: unknown[]) => {
            if (!isZXingNoise(args)) origLog.apply(console, args);
          };
          console.warn = (...args: unknown[]) => {
            if (!isZXingNoise(args)) origWarn.apply(console, args);
          };
          console.error = (...args: unknown[]) => {
            if (!isZXingNoise(args)) origError.apply(console, args);
          };
          restoreConsole = () => {
            console.log = origLog;
            console.warn = origWarn;
            console.error = origError;
          };

          const hints = new Map();
          hints.set(
            DecodeHintType.POSSIBLE_FORMATS,
            resolvedFormats.map((f) => FORMAT_TO_ZXING[f])
          );
          // TRY_HARDER enables exhaustive pattern matching — markedly better at
          // rotated / imperfect 1-D codes. It's costly on a full frame, but we
          // now decode only the small viewfinder ROI, so the cost stays bounded
          // and the accuracy gain is worth it.
          hints.set(DecodeHintType.TRY_HARDER, true);

          const reader = new BrowserMultiFormatReader(hints);
          log("ZXing reader created", { formats: resolvedFormats });

          // Scratch canvas + round-robin cursor for the rotated-retry sweep.
          const rotationCanvas = document.createElement("canvas");
          let rotationIdx = 0;

          let lastScanAt = 0;
          // Debug-only counters powering the heartbeat log.
          let frameCount = 0;
          let decodeCount = 0;
          let lastHeartbeat = 0;

          function scanFrameZXing() {
            if (!active || !videoRef.current || !canvas) return;
            frameCount++;
            const now = performance.now();
            const video = videoRef.current;

            if (
              now - lastScanAt >= ZXING_SCAN_INTERVAL_MS &&
              video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
              video.videoWidth > 0
            ) {
              lastScanAt = now;
              decodeCount++;
              // Draw the viewfinder ROI (full frame until geometry is ready)
              // into the decode canvas, then run ZXing on it.
              if (drawDecodeFrame(video, viewfinderRef.current, canvas)) {
                // decodeFromCanvas throws NotFoundException on every
                // barcode-free frame — swallow it so one orientation missing
                // doesn't skip the rotated retry.
                const decode = (src: HTMLCanvasElement) => {
                  try {
                    return reader.decodeFromCanvas(src);
                  } catch {
                    return null;
                  }
                };
                let result = decode(canvas); // upright
                // Upright miss: retry one rotated orientation (round-robin) so a
                // sideways / upside-down PDF417 or 1-D code still decodes.
                if (!result && tryRotations) {
                  const deg = ROTATED_ORIENTATIONS[rotationIdx];
                  rotationIdx = (rotationIdx + 1) % ROTATED_ORIENTATIONS.length;
                  const rotated =
                    deg && drawRotatedFrame(canvas, deg, rotationCanvas);
                  if (rotated) {
                    result = decode(rotated);
                    if (result) log("ZXing hit on rotated frame", { deg });
                  }
                }
                if (result) {
                  log("ZXing barcode detected", {
                    format: BarcodeFormat[result.getBarcodeFormat()],
                    value: result.getText(),
                  });
                  reportScan(result.getText());
                }
              }
            }

            if (debugRef.current && now - lastHeartbeat > 2000) {
              lastHeartbeat = now;
              log("ZXing scanning…", {
                frames: frameCount,
                decodeAttempts: decodeCount,
                readyState: video.readyState,
                videoWidth: video.videoWidth,
              });
            }

            if (active) rafRef.current = requestAnimationFrame(scanFrameZXing);
          }
          log("ZXing scan loop started");
          rafRef.current = requestAnimationFrame(scanFrameZXing);
        }
      } catch (err) {
        if (!active) return;
        const name = (err as { name?: string }).name ?? "";
        log("camera init failed", {
          name,
          message: (err as { message?: string }).message,
        });
        if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setStatus("no-camera");
        } else {
          setStatus("denied");
        }
      }
    })();

    return () => {
      active = false;
      log("cleanup — stopping camera stream");
      restoreConsole?.();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      if (videoEl) videoEl.srcObject = null;
    };
    // Intentional triggers only: selectedCameraId (user picks a camera),
    // formatsKey (caller changes the scanned formats), and retryNonce (user
    // taps "try again"). resolvedFormats is read inside the effect but tracked
    // via the stable formatsKey instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCameraId, formatsKey, retryNonce]);

  // The select value: explicit user choice → active stream's device → first camera.
  const selectValue =
    selectedCameraId ?? activeStreamDeviceId ?? cameras[0]?.deviceId;

  // Viewfinder shape derived from the formats being scanned.
  const scanShape = getScanShape(resolvedFormats);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="relative bg-black" style={{ aspectRatio }}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {/* Off-screen canvas: both decode paths crop the viewfinder ROI into it. */}
        <canvas ref={canvasRef} className="hidden" />

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
              data-testid="barcode-camera-scanner-retry"
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

        {status === "ready" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/*
              Viewfinder shape reflects the scanned format(s): a square frame for
              QR/Data Matrix/Aztec, a short strip for 1-D barcodes, and a wide
              frame for PDF417 boarding passes or a mixed set. 2-D shapes sweep a
              line across the area; 1-D shows a single steady beam (laser-style).
            */}
            <div
              ref={viewfinderRef}
              className={cn(
                "relative overflow-hidden",
                VIEWFINDER_BY_SHAPE[scanShape]
              )}
            >
              {/* Corner marks */}
              <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-md border-l-2 border-t-2 border-white" />
              <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-md border-r-2 border-t-2 border-white" />
              <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-md border-b-2 border-l-2 border-white" />
              <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-md border-b-2 border-r-2 border-white" />
              {/* Animated scan line — 1-D shows a centered steady beam, 2-D sweeps. */}
              {scanShape === "linear" ? (
                <span className="absolute inset-x-2.5 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-white/70" />
              ) : (
                <span className="absolute inset-x-2.5 h-px animate-[scan_2s_linear_infinite] bg-white/60" />
              )}
            </div>
          </div>
        )}

        {status === "ready" && torchSupported && (
          <div className="absolute bottom-4 left-4 z-10">
            <button
              type="button"
              data-testid="barcode-camera-scanner-torch"
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

        {cameras.length > 1 && (
          <div className="absolute bottom-4 right-4 z-10">
            <Select value={selectValue} onValueChange={handleCameraChange}>
              <SelectTrigger
                data-testid="barcode-camera-scanner-select"
                className={cn(
                  buttonVariants({ size: "icon-xs", variant: "outline" }),
                  "rounded-full border-white/20 bg-black/60 backdrop-blur-sm [&>.lucide-chevron-down]:hidden aspect-square max-h-7"
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

        {/* On-screen debug log — visible on devices with no console (iPad etc.) */}
        {debug && (
          <div className="absolute inset-x-0 top-0 z-30 max-h-[55%] overflow-y-auto bg-black/40 p-2 font-mono text-[10px] leading-snug text-emerald-300 pt-0">
            <div className="sticky top-0 -mt-2 -mx-2 mb-1 flex items-center justify-between bg-black/50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-400/90">
              <span>Scanner debug · {debugLogs.length}</span>
              <button
                type="button"
                data-testid="barcode-scanner-debug-clear"
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
