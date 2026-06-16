"use client";

import { buttonVariants } from "@repo/ayasofyazilim-ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/ayasofyazilim-ui/components/select";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Loader2Icon, SwitchCameraIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── W3C Barcode Detection API types (Chrome/Edge/Safari 17+) ─────────────────
interface BarcodeDetectorResult {
  rawValue: string;
}
interface BarcodeDetectorCtor {
  new (options?: { formats: string[] }): {
    detect(source: HTMLVideoElement): Promise<BarcodeDetectorResult[]>;
  };
  getSupportedFormats(): Promise<string[]>;
}

const BARCODE_FORMATS_NATIVE = [
  "aztec",
  "code_128",
  "code_39",
  "code_93",
  "data_matrix",
  "ean_13",
  "ean_8",
  "itf",
  "pdf417",
  "qr_code",
  "upc_a",
  "upc_e",
];

// ZXing software decode is CPU-heavy — throttle to ~8 fps.
const ZXING_SCAN_INTERVAL_MS = 50;

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
}

export interface BarcodeCameraScannerProps {
  onScan: (code: string) => void;
  /**
   * Milliseconds to suppress the same barcode value from being reported again.
   * Set to 0 to disable (component will stop scanning after the first result).
   * @default 2000
   */
  scanCooldownMs?: number;
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
};

export function BarcodeCameraScanner({
  onScan,
  scanCooldownMs = 2000,
  labels,
}: BarcodeCameraScannerProps) {
  const resolvedLabels = useMemo<Required<BarcodeCameraLabels>>(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels]
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
          return;
        }
        lastScanRef.current = { value, time: now };
      }
      onScanRef.current(value);
    },
    [scanCooldownMs]
  );

  useEffect(() => {
    setStatus("requesting");
    let active = true;
    let restoreConsole: (() => void) | null = null;
    const videoEl = videoRef.current;

    void (async () => {
      try {
        // Stop any previous stream before opening a new one.
        streamRef.current?.getTracks().forEach((tr) => tr.stop());

        const stream = await navigator.mediaDevices.getUserMedia({
          video: selectedCameraId
            ? {
                deviceId: { exact: selectedCameraId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : {
                // Prefer the rear camera on mobile for barcode scanning.
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

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (!active) return;
        setStatus("ready");

        // ── Barcode detection ───────────────────────────────────────────────

        const BDCtor =
          typeof window !== "undefined" && "BarcodeDetector" in window
            ? (window as unknown as { BarcodeDetector: BarcodeDetectorCtor })
                .BarcodeDetector
            : null;

        if (BDCtor) {
          // ── Native path (Chrome/Edge/Safari 17+) ────────────────────────
          let formats = BARCODE_FORMATS_NATIVE;
          try {
            const supported = await BDCtor.getSupportedFormats();
            const supportedSet = new Set(supported);
            const filtered = BARCODE_FORMATS_NATIVE.filter((f) =>
              supportedSet.has(f)
            );
            if (filtered.length > 0) formats = filtered;
          } catch {
            /* use defaults */
          }

          const detector = new BDCtor({ formats });
          // Guard: don't stack async detect() calls if one is still pending.
          let isDetecting = false;

          async function scanFrameNative() {
            if (!active || !videoRef.current) return;
            if (
              !isDetecting &&
              videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
            ) {
              isDetecting = true;
              try {
                const results = await detector.detect(videoRef.current);
                if (results.length > 0 && results[0]) {
                  reportScan(results[0].rawValue);
                }
              } catch {
                /* skip: thrown when video isn't ready */
              } finally {
                isDetecting = false;
              }
            }
            if (active)
              rafRef.current = requestAnimationFrame(
                () => void scanFrameNative()
              );
          }
          rafRef.current = requestAnimationFrame(() => void scanFrameNative());
        } else {
          // ── ZXing software fallback ─────────────────────────────────────
          const canvas = canvasRef.current;
          if (!canvas || !videoRef.current) return;

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
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.AZTEC,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.CODE_93,
            BarcodeFormat.DATA_MATRIX,
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.ITF,
            BarcodeFormat.PDF_417,
            BarcodeFormat.QR_CODE,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
          ]);
          // TRY_HARDER performs exhaustive pattern matching and is very
          // CPU-intensive — omit it to keep the main thread unblocked.

          const reader = new BrowserMultiFormatReader(hints);

          // Cap the decode canvas to this width. ZXing reads barcodes
          // reliably at 640 px; full HD (1920 px) just wastes CPU time.
          const MAX_DECODE_WIDTH = 640;

          let lastScanAt = 0;
          // Cache canvas dimensions so we only reset (expensive) when they change.
          let cvW = 0;
          let cvH = 0;

          function scanFrameZXing() {
            if (!active || !videoRef.current || !canvas) return;
            const now = performance.now();
            const video = videoRef.current;

            if (
              now - lastScanAt >= ZXING_SCAN_INTERVAL_MS &&
              video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
              video.videoWidth > 0
            ) {
              lastScanAt = now;
              // Scale down to MAX_DECODE_WIDTH, preserving aspect ratio.
              const scale = Math.min(1, MAX_DECODE_WIDTH / video.videoWidth);
              const targetW = Math.round(video.videoWidth * scale);
              const targetH = Math.round(video.videoHeight * scale);
              if (targetW !== cvW || targetH !== cvH) {
                cvW = targetW;
                cvH = targetH;
                canvas.width = cvW;
                canvas.height = cvH;
              }
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(video, 0, 0, cvW, cvH);
                try {
                  const result = reader.decodeFromCanvas(canvas);
                  if (result) {
                    reportScan(result.getText());
                  }
                } catch {
                  // NotFoundException thrown on every frame without a barcode — expected.
                }
              }
            }

            if (active) rafRef.current = requestAnimationFrame(scanFrameZXing);
          }
          rafRef.current = requestAnimationFrame(scanFrameZXing);
        }
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
      restoreConsole?.();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      if (videoEl) videoEl.srcObject = null;
    };
    // selectedCameraId is the only intentional trigger: it changes only when the
    // user explicitly picks a different camera from the selector.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCameraId]);

  // The select value: explicit user choice → active stream's device → first camera.
  const selectValue =
    selectedCameraId ?? activeStreamDeviceId ?? cameras[0]?.deviceId;

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {/* Canvas is only used by the ZXing fallback path — kept hidden. */}
        <canvas ref={canvasRef} className="hidden" />

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

        {status === "ready" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/*
              Viewfinder sized for wide 2-D barcodes (PDF417 boarding passes)
              as well as square QR codes. The scan-line animation gives visual
              feedback that the camera is actively scanning.
            */}
            <div className="relative h-36 w-80 overflow-hidden">
              {/* Corner marks */}
              <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-md border-l-2 border-t-2 border-white" />
              <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-md border-r-2 border-t-2 border-white" />
              <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-md border-b-2 border-l-2 border-white" />
              <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-md border-b-2 border-r-2 border-white" />
              {/* Animated scan line */}
              <span className="absolute inset-x-2.5 h-px animate-[scan_2s_linear_infinite] bg-white/60" />
            </div>
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
      </div>
    </div>
  );
}
