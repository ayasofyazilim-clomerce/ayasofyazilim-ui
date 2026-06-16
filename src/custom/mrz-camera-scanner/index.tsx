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
  CameraIcon,
  CheckCircle2Icon,
  Loader2Icon,
  RotateCcwIcon,
  ScanLineIcon,
  SwitchCameraIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  detectDocument,
  ensureOpenCVReady,
  isOpenCVReady,
  measureSharpness,
  type NormalizedBox,
} from "./lib";
import { countFillerChars, readBandText } from "./ocr";

// ── Camera metadata ─────────────────────────────────────────────────────────

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
  labels: Required<MrzCameraLabels>
): string {
  if (cam.facingMode === "environment") return labels.backCamera;
  if (cam.facingMode === "user") return labels.frontCamera;
  if (cam.rawLabel) return cam.rawLabel;
  return `${labels.camera} ${index + 1}`;
}

// The frame is downscaled to this width before analysis — keeps per-frame
// document detection + sharpness cheap enough to run in real time.
const WORKING_WIDTH = 480;

// ── Scoring model (document path, used only when OCR is disabled) ─────────────
const DOC_SHARP_GAIN = 10; // per frame with a sharp document present
const SCORE_DECAY = 8; // per frame with no document

// When no document is detected, OCR this region of the frame (lower-centre,
// where an MRZ usually ends up) so MRZ-only capture still works.
const FALLBACK_OCR_REGION: NormalizedBox = {
  x: 0.04,
  y: 0.3,
  width: 0.92,
  height: 0.66,
};

/**
 * Crop a normalised (0–1) region out of a canvas, downscaled to at most
 * `maxWidth` so OCR stays fast. Returns null if the region is empty.
 */
function cropRegion(
  source: HTMLCanvasElement,
  region: NormalizedBox,
  maxWidth = 1024
): HTMLCanvasElement | null {
  const nx = Math.min(Math.max(0, region.x), 1);
  const ny = Math.min(Math.max(0, region.y), 1);
  const nw = Math.min(1 - nx, region.width);
  const nh = Math.min(1 - ny, region.height);

  const sx = Math.round(nx * source.width);
  const sy = Math.round(ny * source.height);
  const sw = Math.round(nw * source.width);
  const sh = Math.round(nh * source.height);
  if (sw <= 0 || sh <= 0) return null;

  const scaleDown = Math.min(1, maxWidth / sw);
  const ow = Math.max(1, Math.round(sw * scaleDown));
  const oh = Math.max(1, Math.round(sh * scaleDown));

  const out = document.createElement("canvas");
  out.width = ow;
  out.height = oh;
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, ow, oh);
  return out;
}

/** The OCR region: the lower band of the document, or a frame fallback. */
function ocrRegionFor(box: NormalizedBox | null): NormalizedBox {
  if (!box) return FALLBACK_OCR_REGION;
  const lowerFrac = 0.55; // covers passport (bottom ~15%) and ID-1 cards
  const height = box.height * lowerFrac;
  return {
    x: box.x,
    y: box.y + box.height - height,
    width: box.width,
    height,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface MrzCameraLabels {
  /** Shown while requesting camera permission. */
  requesting?: string;
  /** Shown when permission was denied. */
  permissionDenied?: string;
  /** Shown when no camera is found. */
  noCamera?: string;
  /** Display name for the rear/environment-facing camera. */
  backCamera?: string;
  /** Display name for the front/user-facing camera. */
  frontCamera?: string;
  /** Generic camera label prefix when facing mode is unknown. */
  camera?: string;
  /** Idle hint shown when no document is in view. */
  hint?: string;
  /** Shown while the OCR pass is confirming the MRZ. */
  verifying?: string;
  /** Shown once the MRZ has been confirmed. */
  mrzConfirmed?: string;
  /** Shown when the frame is too blurry. */
  tooBlurry?: string;
  /** Shown when a manual capture found no MRZ. */
  noMrz?: string;
  /** Manual capture button label. */
  capture?: string;
  /** Overlay title shown after a successful capture. */
  captured?: string;
  /** "Scan again" button label. */
  scanAgain?: string;
}

export interface MrzCameraScannerProps {
  /**
   * Called with the captured frame as a Base64 data URL (`image/jpeg`) once the
   * confidence score reaches `scoreTarget` and (if enabled) the MRZ has been
   * confirmed, or when the user presses the manual capture button.
   */
  onCapture: (imageBase64: string) => void;
  /** Confidence score that must be reached to auto-capture. @default 100 */
  scoreTarget?: number;
  /** Minimum document-detection quality (0–1) to count a frame. @default 0.5 */
  minDocumentScore?: number;
  /** Minimum interval between detection passes, in ms. @default 150 */
  scanIntervalMs?: number;
  /** JPEG quality for the captured image, 0–1. @default 0.92 */
  imageQuality?: number;
  /**
   * Minimum sharpness (variance of the Laplacian) for a frame to add to the
   * score. Set to 0 to disable the blur gate. @default 50
   */
  blurThreshold?: number;
  /**
   * When false, never auto-captures — the user must press the capture button.
   * @default true
   */
  autoCapture?: boolean;
  /**
   * When true, the detected document is OCR'd and capture only proceeds if the
   * MRZ `<` filler is found. Runs asynchronously without blocking the detection
   * loop. @default true
   */
  verifyText?: boolean;
  /** Minimum `<` filler characters OCR must find to confirm. @default 3 */
  minFillerChars?: number;
  /** Minimum gap between OCR verification attempts, in ms. @default 1500 */
  verifyCooldownMs?: number;
  /** Overlays live detector readings to help tune thresholds. @default false */
  debug?: boolean;
  labels?: MrzCameraLabels;
}

type ScannerStatus = "requesting" | "ready" | "denied" | "no-camera";

const DEFAULT_LABELS: Required<MrzCameraLabels> = {
  requesting: "Requesting camera access…",
  permissionDenied:
    "Camera access was denied. Please allow camera access and reload.",
  noCamera: "No camera found on this device.",
  backCamera: "Back Camera",
  frontCamera: "Front Camera",
  camera: "Camera",
  hint: "Point the camera at a passport or ID",
  verifying: "Confirming MRZ…",
  mrzConfirmed: "MRZ confirmed",
  tooBlurry: "Too blurry — hold steady",
  noMrz: "No MRZ found — try again",
  capture: "Capture",
  captured: "Photo captured",
  scanAgain: "Scan again",
};

export function MrzCameraScanner({
  onCapture,
  scoreTarget = 100,
  minDocumentScore = 0.5,
  scanIntervalMs = 150,
  imageQuality = 0.92,
  blurThreshold = 50,
  autoCapture = true,
  verifyText = true,
  minFillerChars = 3,
  verifyCooldownMs = 1500,
  debug = false,
  labels,
}: MrzCameraScannerProps) {
  const resolvedLabels = useMemo<Required<MrzCameraLabels>>(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels]
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  // Small canvas for downscaled per-frame analysis.
  const workCanvasRef = useRef<HTMLCanvasElement>(null);
  // Full-resolution canvas for the captured JPEG + OCR crops.
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // Mirror props into refs so the long-lived scan loop reads fresh values.
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;
  const scoreTargetRef = useRef(scoreTarget);
  scoreTargetRef.current = scoreTarget;
  const minDocumentScoreRef = useRef(minDocumentScore);
  minDocumentScoreRef.current = minDocumentScore;
  const scanIntervalMsRef = useRef(scanIntervalMs);
  scanIntervalMsRef.current = scanIntervalMs;
  const imageQualityRef = useRef(imageQuality);
  imageQualityRef.current = imageQuality;
  const blurThresholdRef = useRef(blurThreshold);
  blurThresholdRef.current = blurThreshold;
  const autoCaptureRef = useRef(autoCapture);
  autoCaptureRef.current = autoCapture;
  const verifyTextRef = useRef(verifyText);
  verifyTextRef.current = verifyText;
  const minFillerCharsRef = useRef(minFillerChars);
  minFillerCharsRef.current = minFillerChars;
  const verifyCooldownMsRef = useRef(verifyCooldownMs);
  verifyCooldownMsRef.current = verifyCooldownMs;
  const debugRef = useRef(debug);
  debugRef.current = debug;

  // Loop bookkeeping.
  const pausedRef = useRef(false); // true after capture (shows captured state)
  const scoreRef = useRef(0);
  const mrzConfirmedRef = useRef(false);
  const verifyingRef = useRef(false);
  const lastVerifyAtRef = useRef(0);
  const lastFillerRef = useRef(0);
  // Latest detected document box (or null), so manual capture can reuse it for
  // a tighter OCR crop without waiting on the loop.
  const lastDocBoxRef = useRef<NormalizedBox | null>(null);
  const activeCameraIdRef = useRef<string | undefined>(undefined);
  // Native video dimensions, captured once — used to map the work-canvas
  // corner coordinates onto the (object-cover) displayed video.
  const videoDimsRef = useRef<{ w: number; h: number } | null>(null);

  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [activeStreamDeviceId, setActiveStreamDeviceId] = useState<
    string | undefined
  >(undefined);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(
    () => {
      if (typeof window === "undefined") return undefined;
      try {
        return localStorage.getItem("mrz-scanner-camera-id") ?? undefined;
      } catch {
        return undefined;
      }
    }
  );
  const [status, setStatus] = useState<ScannerStatus>("requesting");
  const [detectorReady, setDetectorReady] = useState(() => isOpenCVReady());
  const [score, setScore] = useState(0);
  const [docDetected, setDocDetected] = useState(false);
  const [tooBlurry, setTooBlurry] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [mrzConfirmed, setMrzConfirmed] = useState(false);
  const [noMrz, setNoMrz] = useState(false);
  const [paused, setPaused] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    score: number;
    docScore: number;
    sharpness: number;
    filler: number;
  } | null>(null);
  // Debug-only: native video size + the detected document corners (normalised
  // 0–1), drawn live as an overlay polygon.
  const [videoDims, setVideoDims] = useState<{ w: number; h: number } | null>(
    null
  );
  const [debugCorners, setDebugCorners] = useState<
    { x: number; y: number }[] | null
  >(null);

  // Kick off the OpenCV WASM runtime as soon as the component mounts.
  useEffect(() => {
    let active = true;
    void ensureOpenCVReady().then(() => {
      if (active) setDetectorReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleCameraChange = useCallback((deviceId: string) => {
    setSelectedCameraId(deviceId);
    try {
      localStorage.setItem("mrz-scanner-camera-id", deviceId);
    } catch {
      // localStorage may be unavailable (private browsing, etc.)
    }
  }, []);

  const resetScanState = useCallback(() => {
    scoreRef.current = 0;
    mrzConfirmedRef.current = false;
    verifyingRef.current = false;
    lastFillerRef.current = 0;
    setScore(0);
    setDocDetected(false);
    setTooBlurry(false);
    setVerifying(false);
    setMrzConfirmed(false);
    setNoMrz(false);
  }, []);

  // Emit a captured frame from the full-res canvas (which already holds the
  // frame we want) and switch to the captured state.
  const emitCapture = useCallback(
    (canvas: HTMLCanvasElement) => {
      const dataUrl = canvas.toDataURL("image/jpeg", imageQualityRef.current);
      pausedRef.current = true;
      resetScanState();
      setPaused(true);
      onCaptureRef.current(dataUrl);
    },
    [resetScanState]
  );

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

  // Capture the full-res frame without MRZ verification (used when OCR is off,
  // or for the document-score auto path).
  const finalizeCapture = useCallback(() => {
    const canvas = snapshot();
    if (canvas) emitCapture(canvas);
  }, [snapshot, emitCapture]);
  const finalizeCaptureRef = useRef(finalizeCapture);
  finalizeCaptureRef.current = finalizeCapture;

  // OCR verification — runs async, does NOT pause the detection loop. On a
  // confirmed MRZ it captures the exact verified frame (MRZ is sufficient, even
  // with no document detected). `manual` surfaces failures as user feedback.
  const verifyMrz = useCallback(
    async (box: NormalizedBox | null, manual = false) => {
      if (verifyingRef.current || mrzConfirmedRef.current) return;
      const canvas = snapshot();
      if (!canvas) return;

      verifyingRef.current = true;
      lastVerifyAtRef.current = performance.now();
      setVerifying(true);
      setNoMrz(false);
      try {
        // Don't OCR (or capture) a blurry frame.
        const threshold = blurThresholdRef.current;
        if (
          threshold > 0 &&
          isOpenCVReady() &&
          measureSharpness(canvas) < threshold
        ) {
          if (manual) setTooBlurry(true);
          return;
        }

        const crop = cropRegion(canvas, ocrRegionFor(box));
        const text = crop ? await readBandText(crop) : "";
        const filler = countFillerChars(text);
        lastFillerRef.current = filler;

        if (filler >= minFillerCharsRef.current) {
          // Confirmed — capture this verified frame.
          mrzConfirmedRef.current = true;
          setMrzConfirmed(true);
          emitCapture(canvas);
        } else if (manual) {
          // User pressed capture but there's no MRZ here — tell them.
          setNoMrz(true);
        }
      } catch {
        /* OCR error — leave unconfirmed; the loop retries after cooldown */
      } finally {
        verifyingRef.current = false;
        setVerifying(false);
      }
    },
    [snapshot, emitCapture]
  );
  const verifyMrzRef = useRef(verifyMrz);
  verifyMrzRef.current = verifyMrz;

  // Manual capture. With OCR on, it must still confirm an MRZ (the user may
  // have pressed at the wrong moment); with OCR off it's a blur-checked grab.
  const handleManualCapture = useCallback(() => {
    if (verifyingRef.current) return;
    if (verifyTextRef.current) {
      void verifyMrz(lastDocBoxRef.current, true);
      return;
    }
    const canvas = snapshot();
    if (!canvas) return;
    const threshold = blurThresholdRef.current;
    if (
      threshold > 0 &&
      isOpenCVReady() &&
      measureSharpness(canvas) < threshold
    ) {
      setTooBlurry(true);
      return;
    }
    emitCapture(canvas);
  }, [verifyMrz, snapshot, emitCapture]);

  const handleScanAgain = useCallback(() => {
    pausedRef.current = false;
    resetScanState();
    setPaused(false);
  }, [resetScanState]);

  // ── Camera open + real-time detection / scoring loop ───────────────────────
  useEffect(() => {
    setStatus("requesting");
    let active = true;
    const videoEl = videoRef.current;

    void (async () => {
      try {
        streamRef.current?.getTracks().forEach((tr) => tr.stop());

        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedCameraId
            ? {
                deviceId: { exact: selectedCameraId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
        });

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

        let lastScanAt = 0;
        function scanFrame() {
          if (!active) return;
          const video = videoRef.current;
          const work = workCanvasRef.current;
          const now = performance.now();

          if (
            video &&
            work &&
            !pausedRef.current &&
            isOpenCVReady() &&
            now - lastScanAt >= scanIntervalMsRef.current &&
            video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            video.videoWidth > 0
          ) {
            lastScanAt = now;

            const scale = Math.min(1, WORKING_WIDTH / video.videoWidth);
            const w = Math.round(video.videoWidth * scale);
            const h = Math.round(video.videoHeight * scale);
            if (work.width !== w) work.width = w;
            if (work.height !== h) work.height = h;

            // Record native video size once, for the debug corner overlay.
            if (
              !videoDimsRef.current ||
              videoDimsRef.current.w !== video.videoWidth
            ) {
              videoDimsRef.current = {
                w: video.videoWidth,
                h: video.videoHeight,
              };
              setVideoDims(videoDimsRef.current);
            }

            const ctx = work.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0, w, h);

              // 1) Document corners — used to locate the MRZ band, drive the
              //    overlay/score, and (when OCR is off) trigger capture.
              const doc = detectDocument(work);
              const docOk = !!doc && doc.score >= minDocumentScoreRef.current;
              lastDocBoxRef.current = doc ? doc.box : null;

              // Debug: surface the detected corners (normalised) for the overlay.
              if (debugRef.current) {
                setDebugCorners(
                  doc
                    ? [
                        doc.corners.topLeftCorner,
                        doc.corners.topRightCorner,
                        doc.corners.bottomRightCorner,
                        doc.corners.bottomLeftCorner,
                      ].map((c) => ({ x: c.x / w, y: c.y / h }))
                    : null
                );
              }

              // 2) Sharpness — measured every frame so MRZ-only capture (no
              //    document) still works.
              const threshold = blurThresholdRef.current;
              const sharpness = measureSharpness(work);
              const sharp = threshold <= 0 || sharpness >= threshold;

              // 3) Update the document score (drives the bar; gates the
              //    OCR-off capture path).
              const target = scoreTargetRef.current;
              if (docOk && sharp) {
                scoreRef.current = Math.min(
                  target,
                  scoreRef.current + DOC_SHARP_GAIN
                );
              } else if (!docOk) {
                scoreRef.current = Math.max(0, scoreRef.current - SCORE_DECAY);
              }

              setScore(scoreRef.current);
              setDocDetected(docOk);
              setTooBlurry(docOk && !sharp);

              // 4) MRZ is the primary signal: verify whenever the frame is
              //    sharp, with or without a detected document (async, never
              //    blocks the loop). A confirmed MRZ captures immediately.
              if (
                autoCaptureRef.current &&
                verifyTextRef.current &&
                sharp &&
                !mrzConfirmedRef.current &&
                !verifyingRef.current &&
                now - lastVerifyAtRef.current >= verifyCooldownMsRef.current
              ) {
                void verifyMrzRef.current(doc ? doc.box : null, false);
              }

              // 5) OCR-off fallback: capture on a stable, sharp document.
              if (
                autoCaptureRef.current &&
                !verifyTextRef.current &&
                scoreRef.current >= target
              ) {
                finalizeCaptureRef.current();
              }

              if (debugRef.current) {
                setDebugInfo({
                  score: Math.round(scoreRef.current),
                  docScore: doc ? Math.round(doc.score * 100) / 100 : 0,
                  sharpness: Math.round(sharpness),
                  filler: lastFillerRef.current,
                });
              }
            }
          }

          rafRef.current = requestAnimationFrame(scanFrame);
        }
        rafRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        if (!active) return;
        const name = (err as { name?: string }).name ?? "";
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
    // selectedCameraId is the only dependency — every other value the loop
    // needs is read through a ref, so the camera stream is not torn down on
    // unrelated prop/state changes.
  }, [selectedCameraId]);

  const selectValue =
    selectedCameraId ?? activeStreamDeviceId ?? cameras[0]?.deviceId;

  const scorePct = Math.min(
    100,
    Math.round((score / Math.max(1, scoreTarget)) * 100)
  );

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {/* Hidden canvases: downscaled analysis + full-res capture/OCR. */}
        <canvas ref={workCanvasRef} className="hidden" />
        <canvas ref={captureCanvasRef} className="hidden" />

        {/* Debug-only: live document corners. The SVG viewBox matches the
            native video size with `slice`, replicating the video's object-cover
            so the polygon lines up with what's on screen. */}
        {debug &&
          status === "ready" &&
          !paused &&
          videoDims &&
          debugCorners && (
            <svg
              className="pointer-events-none absolute inset-0 z-10 h-full w-full"
              viewBox={`0 0 ${videoDims.w} ${videoDims.h}`}
              preserveAspectRatio="xMidYMid slice"
            >
              <polygon
                points={debugCorners
                  .map((c) => `${c.x * videoDims.w},${c.y * videoDims.h}`)
                  .join(" ")}
                fill="rgba(52,211,153,0.12)"
                stroke="#34d399"
                strokeWidth={3}
                vectorEffect="non-scaling-stroke"
              />
              {debugCorners.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x * videoDims.w}
                  cy={c.y * videoDims.h}
                  r={Math.max(videoDims.w, videoDims.h) * 0.012}
                  fill="#34d399"
                />
              ))}
            </svg>
          )}

        {debug && debugInfo && status === "ready" && !paused && (
          <div className="pointer-events-none absolute left-2 top-2 z-20 space-y-0.5 rounded bg-black/70 px-2 py-1 font-mono text-[10px] leading-tight text-white">
            <div>
              score: {debugInfo.score} / {scoreTarget}
            </div>
            <div>
              doc score: {debugInfo.docScore} (need ≥{minDocumentScore})
            </div>
            <div>
              sharpness: {debugInfo.sharpness} / {blurThreshold}
            </div>
            {verifyText && (
              <div>
                last OCR &lt;: {debugInfo.filler} (need ≥{minFillerChars})
              </div>
            )}
            <div>mrz: {mrzConfirmed ? "confirmed" : "no"}</div>
          </div>
        )}

        {status === "requesting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white">
            <Loader2Icon className="size-6 animate-spin" />
            <p className="text-sm">{resolvedLabels.requesting}</p>
          </div>
        )}

        {status === "denied" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-sm text-white">
            {resolvedLabels.permissionDenied}
          </div>
        )}

        {status === "no-camera" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-sm text-white">
            {resolvedLabels.noCamera}
          </div>
        )}

        {status === "ready" && !paused && (
          <>
            {/* Status pill */}
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white backdrop-blur-sm",
                  mrzConfirmed
                    ? "bg-emerald-600/80"
                    : verifying
                      ? "bg-sky-600/80"
                      : tooBlurry || noMrz
                        ? "bg-amber-600/80"
                        : docDetected
                          ? "bg-slate-700/80"
                          : "bg-black/60"
                )}
              >
                {mrzConfirmed ? (
                  <CheckCircle2Icon className="size-3.5" />
                ) : verifying ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : tooBlurry || noMrz ? (
                  <TriangleAlertIcon className="size-3.5" />
                ) : (
                  <ScanLineIcon className="size-3.5" />
                )}
                {mrzConfirmed
                  ? resolvedLabels.mrzConfirmed
                  : verifying
                    ? resolvedLabels.verifying
                    : tooBlurry
                      ? resolvedLabels.tooBlurry
                      : noMrz
                        ? resolvedLabels.noMrz
                        : resolvedLabels.hint}
              </span>
            </div>

            {/* Score progress bar */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/10">
              <div
                className={cn(
                  "h-full transition-[width] duration-150",
                  mrzConfirmed ? "bg-emerald-400" : "bg-sky-400"
                )}
                style={{ width: `${scorePct}%` }}
              />
            </div>

            {/* Manual capture button */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <Button
                data-testid="mrz-camera-scanner-capture"
                size="sm"
                variant="secondary"
                className="rounded-full"
                disabled={!detectorReady || verifying}
                onClick={handleManualCapture}
              >
                {detectorReady ? (
                  <CameraIcon className="size-4" />
                ) : (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {resolvedLabels.capture}
              </Button>
            </div>
          </>
        )}

        {status === "ready" && paused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-white">
            <CheckCircle2Icon className="size-8 text-emerald-400" />
            <p className="text-sm font-medium">{resolvedLabels.captured}</p>
            <Button
              data-testid="mrz-camera-scanner-scan-again"
              variant="secondary"
              size="sm"
              onClick={handleScanAgain}
            >
              <RotateCcwIcon className="size-4" />
              {resolvedLabels.scanAgain}
            </Button>
          </div>
        )}

        {cameras.length > 1 && (
          <div className="absolute bottom-4 right-4 z-10">
            <Select value={selectValue} onValueChange={handleCameraChange}>
              <SelectTrigger
                data-testid="mrz-camera-scanner-select"
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
      </div>
    </div>
  );
}
