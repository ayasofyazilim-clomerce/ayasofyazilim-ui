"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CameraSurface — the shared UI shell for every viewfinder-style scanner.
//
// It renders everything that was duplicated across the barcode / credit-card /
// MRZ scanners: the <video>, the requesting / permission-denied / no-camera
// overlays, the retry button, the torch toggle, the camera selector and the
// on-screen debug log. Each scanner keeps only what's unique to it — its decode
// loop, its result handling and its viewfinder — and passes the viewfinder (plus
// any decode canvases) as `children`.
//
// The scanner owns the <video> ref and the `useCameraStream` result so its decode
// loop can read frames directly; CameraSurface is purely presentational.
// ─────────────────────────────────────────────────────────────────────────────

import { buttonVariants } from "@repo/ayasofyazilim-ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/ayasofyazilim-ui/components/select";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  FlashlightIcon,
  FlashlightOffIcon,
  Loader2Icon,
  RotateCcwIcon,
  SwitchCameraIcon,
} from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { cameraDisplayLabel, type UseCameraStreamResult } from "./index";

/** One rendered line of the on-screen debug log. */
export interface CameraDebugEntry {
  id: number;
  time: string;
  message: string;
  data?: string;
}

/** The label subset every camera surface needs. */
export interface CameraSurfaceLabels {
  requesting: string;
  permissionDenied: string;
  noCamera: string;
  backCamera: string;
  frontCamera: string;
  camera: string;
  torch: string;
  retry: string;
}

export interface CameraSurfaceProps {
  /** The result of `useCameraStream()` from the owning scanner. */
  camera: UseCameraStreamResult;
  /** The scanner's own <video> ref — CameraSurface renders the element with it. */
  videoRef: RefObject<HTMLVideoElement | null>;
  labels: CameraSurfaceLabels;
  /** Prefix for the interactive elements' data-testid (e.g. "barcode-camera-scanner"). */
  testIdPrefix: string;
  /** CSS `aspect-ratio` for the viewport. @default "1 / 1" */
  aspectRatio?: string;
  /** Show the torch + camera-selector controls. @default true */
  showControls?: boolean;
  /**
   * When provided, renders the standard debug-log overlay from these entries.
   * Pass `undefined` to hide it (i.e. when the scanner's `debug` prop is off).
   */
  debugLogs?: CameraDebugEntry[];
  onClearDebugLogs?: () => void;
  /** Scanner-specific overlays: viewfinder, status pills, captured state, decode canvases. */
  children?: ReactNode;
  /** Extra classes on the outer bordered container. */
  className?: string;
}

export function CameraSurface({
  camera,
  videoRef,
  labels,
  testIdPrefix,
  aspectRatio = "1 / 1",
  showControls = true,
  debugLogs,
  onClearDebugLogs,
  children,
  className,
}: CameraSurfaceProps) {
  const { status } = camera;
  const ready = status === "ready";

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <div className="relative bg-black" style={{ aspectRatio }}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />

        {/* Scanner-specific overlays + hidden decode canvases. */}
        {children}

        {status === "requesting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white">
            <Loader2Icon className="size-6 animate-spin" />
            <p className="text-sm">{labels.requesting}</p>
          </div>
        )}

        {(status === "denied" || status === "no-camera") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-4 text-center text-sm text-white">
            <p>
              {status === "denied" ? labels.permissionDenied : labels.noCamera}
            </p>
            <button
              type="button"
              data-testid={`${testIdPrefix}-retry`}
              onClick={camera.retry}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              )}
            >
              <RotateCcwIcon className="size-4" />
              {labels.retry}
            </button>
          </div>
        )}

        {ready && showControls && camera.torchSupported && (
          <div className="absolute bottom-4 left-4 z-10">
            <button
              type="button"
              data-testid={`${testIdPrefix}-torch`}
              aria-label={labels.torch}
              aria-pressed={camera.torchOn}
              onClick={camera.toggleTorch}
              className={cn(
                buttonVariants({ size: "icon-xs", variant: "outline" }),
                "aspect-square max-h-7 rounded-full border-white/20 backdrop-blur-sm",
                camera.torchOn
                  ? "bg-white text-black hover:bg-white"
                  : "bg-black/60 text-white"
              )}
            >
              {camera.torchOn ? <FlashlightIcon /> : <FlashlightOffIcon />}
            </button>
          </div>
        )}

        {ready && showControls && camera.cameras.length > 1 && (
          <div className="absolute bottom-4 right-4 z-10">
            <Select
              value={camera.activeDeviceId ?? camera.cameras[0]?.deviceId}
              onValueChange={camera.selectCamera}
            >
              <SelectTrigger
                data-testid={`${testIdPrefix}-select`}
                className={cn(
                  buttonVariants({ size: "icon-xs", variant: "outline" }),
                  "aspect-square max-h-7 rounded-full border-white/20 bg-black/60 backdrop-blur-sm [&>.lucide-chevron-down]:hidden"
                )}
              >
                <SwitchCameraIcon />
              </SelectTrigger>
              <SelectContent align="end">
                {camera.cameras.map((cam, i) => (
                  <SelectItem key={cam.deviceId} value={cam.deviceId}>
                    {cameraDisplayLabel(cam, i, labels)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* On-screen debug log — visible on devices with no console (iPad etc.) */}
        {debugLogs && (
          <div className="absolute inset-x-0 top-0 z-30 max-h-[55%] overflow-y-auto bg-black/40 p-2 pt-0 font-mono text-[10px] leading-snug text-emerald-300">
            <div className="sticky top-0 -mx-2 -mt-2 mb-1 flex items-center justify-between bg-black/50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-400/90">
              <span>Scanner debug · {debugLogs.length}</span>
              <button
                type="button"
                data-testid={`${testIdPrefix}-debug-clear`}
                className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-200"
                onClick={onClearDebugLogs}
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
