"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Shared camera-stream manager
//
// Every camera scanner in this package (barcode, credit-card, MRZ, webcam) used
// to call `getUserMedia` on its own and fully stop the stream on unmount. In a
// flow that opens several scanners in sequence - e.g. the traveller "validate"
// screen (boarding-pass → claim-tag → rescan) - that meant one camera
// acquisition per scanner, and one permission prompt per acquisition on
// platforms that don't persist the grant (iOS Safari, in-app WKWebViews).
//
// This module centralises acquisition behind a single process-wide MediaStream
// that is *ref-counted* across consumers and *kept warm* for a short grace
// period after the last consumer unmounts. The result:
//   • The first scanner triggers exactly one `getUserMedia`; later scanners that
//     want the same camera reuse the live stream - no second prompt, no restart
//     flash, no "camera busy" race while the previous scanner releases.
//   • Rapid transitions (reopening a modal, switching tabs, scanning several
//     items back-to-back) never re-acquire.
//   • Device selection, torch and continuous autofocus are handled once, here.
//
// Note on long gaps: the keep-warm window is measured in seconds, so it collapses
// *close-in-time* re-acquisitions. Steps separated by minutes (reading a result
// before the next scan) still re-acquire - bridging those would mean holding the
// camera (and its "in use" indicator) on the whole time, which we deliberately
// don't do.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

// ── Shared camera types ───────────────────────────────────────────────────────

export type CameraFacing = "environment" | "user";
export type CameraStatus = "requesting" | "ready" | "denied" | "no-camera";

export interface CameraInfo {
  deviceId: string;
  /** OS-supplied raw label. */
  rawLabel: string;
  /** Resolved from the stream track settings, or inferred from the OS label. */
  facingMode: CameraFacing | undefined;
}

// `focusMode` and `torch` are real, widely-shipped camera capabilities the
// standard DOM lib types don't model yet. We read/apply them through these
// narrow extensions, always capability-gated and wrapped in try/catch.
interface ExtendedTrackCapabilities extends MediaTrackCapabilities {
  focusMode?: string[];
  torch?: boolean;
}
interface ExtendedConstraintSet {
  focusMode?: string;
  torch?: boolean;
}

/** Try to infer facing mode from the OS-supplied label string. */
export function inferFacingFromLabel(label: string): CameraFacing | undefined {
  const l = label.toLowerCase();
  if (l.includes("back") || l.includes("rear") || l.includes("environment"))
    return "environment";
  if (l.includes("front") || l.includes("user") || l.includes("selfie"))
    return "user";
  return undefined;
}

/** Human-readable camera name for the selector, given a scanner's labels. */
export function cameraDisplayLabel(
  cam: CameraInfo,
  index: number,
  labels: { backCamera: string; frontCamera: string; camera: string }
): string {
  if (cam.facingMode === "environment") return labels.backCamera;
  if (cam.facingMode === "user") return labels.frontCamera;
  if (cam.rawLabel) return cam.rawLabel;
  return `${labels.camera} ${index + 1}`;
}

// getUserMedia error names meaning the *stored* camera no longer matches a usable
// device - we forget the saved selection and fall back to the default camera.
const STALE_DEVICE_ERRORS = new Set([
  "OverconstrainedError",
  "NotFoundError",
  "DevicesNotFoundError",
]);
// Error names meaning the camera is momentarily busy - another consumer is still
// releasing it, or another tab/app holds it. Worth a brief automatic retry.
const CAMERA_BUSY_ERRORS = new Set([
  "NotReadableError",
  "AbortError",
  "TrackStartError",
]);
const MAX_CAMERA_BUSY_RETRIES = 2;
const CAMERA_BUSY_RETRY_MS = 400;

// How long the shared stream is kept alive after the last consumer releases, so
// a scanner opened moments later reuses it instead of re-prompting.
const DEFAULT_KEEP_WARM_MS = 8000;

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

// ── Singleton store ────────────────────────────────────────────────────────────

interface CameraState {
  stream: MediaStream | null;
  status: CameraStatus;
  cameras: CameraInfo[];
  activeDeviceId: string | undefined;
  facingMode: CameraFacing | undefined;
  torchSupported: boolean;
  torchOn: boolean;
  /** Bumps on every successful (re)open so consumers can react to a new stream. */
  streamId: number;
}

// Stable reference returned during SSR - must never change identity or
// useSyncExternalStore loops.
const SERVER_STATE: CameraState = {
  stream: null,
  status: "requesting",
  cameras: [],
  activeDeviceId: undefined,
  facingMode: undefined,
  torchSupported: false,
  torchOn: false,
  streamId: 0,
};

let state: CameraState = { ...SERVER_STATE };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function setState(patch: Partial<CameraState>) {
  state = { ...state, ...patch };
  emit();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function getSnapshot() {
  return state;
}
function getServerSnapshot() {
  return SERVER_STATE;
}

// ── Acquisition internals ──────────────────────────────────────────────────────

interface CameraRequest {
  deviceId?: string;
  facingMode?: CameraFacing;
  width?: number;
  height?: number;
}

let refCount = 0;
// Signature of the currently live stream, and of the open in flight. A signature
// captures the constraints that materially change which physical camera opens.
let currentSignature: string | null = null;
let pendingSignature: string | null = null;
// Serialises opens so two rapid requests can't run two concurrent getUserMedia
// calls (which would fight over the camera).
let acquireChain: Promise<void> = Promise.resolve();
let keepWarmTimer: ReturnType<typeof setTimeout> | null = null;

function signatureOf(r: CameraRequest): string {
  return [
    r.deviceId ?? "",
    r.facingMode ?? "environment",
    r.width ?? DEFAULT_WIDTH,
    r.height ?? DEFAULT_HEIGHT,
  ].join("|");
}

function videoConstraints(r: CameraRequest): MediaTrackConstraints {
  const base: MediaTrackConstraints = {
    width: { ideal: r.width ?? DEFAULT_WIDTH },
    height: { ideal: r.height ?? DEFAULT_HEIGHT },
  };
  return r.deviceId
    ? { ...base, deviceId: { exact: r.deviceId } }
    : { ...base, facingMode: { ideal: r.facingMode ?? "environment" } };
}

function stopStream() {
  if (state.stream) {
    state.stream.getTracks().forEach((tr) => tr.stop());
  }
  currentSignature = null;
  setState({
    stream: null,
    status: "requesting",
    cameras: [],
    activeDeviceId: undefined,
    facingMode: undefined,
    torchSupported: false,
    torchOn: false,
  });
}

/** Resolve the actual stream, healing a stale stored device and riding out a
 *  momentarily-busy camera. `storageKey` (if given) is cleared on stale device. */
async function acquireStream(
  req: CameraRequest,
  storageKey?: string
): Promise<MediaStream> {
  let useDeviceId = req.deviceId;
  for (let attempt = 0; ; attempt++) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: videoConstraints({ ...req, deviceId: useDeviceId }),
      });
    } catch (err) {
      const name = (err as { name?: string }).name ?? "";
      if (useDeviceId && STALE_DEVICE_ERRORS.has(name)) {
        if (storageKey) {
          try {
            localStorage.removeItem(storageKey);
          } catch {
            /* localStorage may be unavailable (private browsing, etc.) */
          }
        }
        useDeviceId = undefined;
        continue;
      }
      if (CAMERA_BUSY_ERRORS.has(name) && attempt < MAX_CAMERA_BUSY_RETRIES) {
        await new Promise((resolve) => {
          setTimeout(resolve, CAMERA_BUSY_RETRY_MS);
        });
        continue;
      }
      throw err;
    }
  }
}

async function openStream(
  req: CameraRequest,
  storageKey: string | undefined,
  mySig: string
): Promise<void> {
  // A newer request superseded us before this chained op ran.
  if (pendingSignature !== mySig) return;

  setState({ status: "requesting", torchSupported: false, torchOn: false });

  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ status: "denied" });
      return;
    }

    const stream = await acquireStream(req, storageKey);

    // Superseded while awaiting getUserMedia - throw the fresh stream away.
    if (pendingSignature !== mySig) {
      stream.getTracks().forEach((tr) => tr.stop());
      return;
    }

    // Swap in the new stream, stopping the old one only now to minimise downtime.
    if (state.stream && state.stream !== stream) {
      state.stream.getTracks().forEach((tr) => tr.stop());
    }

    const track = stream.getVideoTracks()[0];
    const settings = track?.getSettings();
    const facing = settings?.facingMode as CameraFacing | undefined;
    const activeDeviceId = settings?.deviceId;

    // Continuous autofocus is the single biggest win for close-up scanning; torch
    // is exposed only when the track advertises it. Both are non-fatal.
    let torchSupported = false;
    if (track) {
      try {
        const caps = track.getCapabilities?.() as
          | ExtendedTrackCapabilities
          | undefined;
        if (caps?.focusMode?.includes("continuous")) {
          await track.applyConstraints({
            advanced: [{ focusMode: "continuous" } as ExtendedConstraintSet],
          } as MediaTrackConstraints);
        }
        if (caps?.torch) torchSupported = true;
      } catch {
        /* focus/torch setup skipped (constraint unsupported) */
      }
    }

    let cameras: CameraInfo[] = [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      cameras = devices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({
          deviceId: d.deviceId,
          rawLabel: d.label,
          facingMode:
            d.deviceId === activeDeviceId
              ? facing
              : inferFacingFromLabel(d.label),
        }));
    } catch {
      /* enumeration may fail before permission settles - selector just hides */
    }

    // Superseded during the post-acquire awaits - discard.
    if (pendingSignature !== mySig) {
      stream.getTracks().forEach((tr) => tr.stop());
      return;
    }

    currentSignature = mySig;
    setState({
      stream,
      status: "ready",
      cameras,
      activeDeviceId,
      facingMode: facing,
      torchSupported,
      torchOn: false,
      streamId: state.streamId + 1,
    });
  } catch (err) {
    if (pendingSignature !== mySig) return;
    const name = (err as { name?: string }).name ?? "";
    setState({
      status:
        name === "NotFoundError" || name === "DevicesNotFoundError"
          ? "no-camera"
          : "denied",
    });
  } finally {
    if (pendingSignature === mySig) pendingSignature = null;
  }
}

function requestStream(req: CameraRequest, storageKey?: string) {
  const wantSig = signatureOf(req);
  // Already live with these constraints - reuse the warm stream.
  if (state.stream && currentSignature === wantSig) return;
  // Already opening exactly this - let it finish.
  if (pendingSignature === wantSig) return;
  pendingSignature = wantSig;
  acquireChain = acquireChain.then(() => openStream(req, storageKey, wantSig));
}

function retryStream(req: CameraRequest, storageKey?: string) {
  currentSignature = null;
  pendingSignature = null;
  requestStream(req, storageKey);
}

function retain(req: CameraRequest, storageKey?: string) {
  refCount += 1;
  if (keepWarmTimer) {
    clearTimeout(keepWarmTimer);
    keepWarmTimer = null;
  }
  requestStream(req, storageKey);
}

function release(keepWarmMs: number) {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0) return;
  if (keepWarmTimer) clearTimeout(keepWarmTimer);
  if (keepWarmMs <= 0) {
    stopStream();
    return;
  }
  keepWarmTimer = setTimeout(() => {
    keepWarmTimer = null;
    if (refCount === 0) stopStream();
  }, keepWarmMs);
}

async function setTorch(on: boolean) {
  const track = state.stream?.getVideoTracks()[0];
  if (!track) return;
  try {
    await track.applyConstraints({
      advanced: [{ torch: on } as ExtendedConstraintSet],
    } as MediaTrackConstraints);
    setState({ torchOn: on });
  } catch {
    /* torch unsupported on this track - ignore */
  }
}

// ── Public hook ────────────────────────────────────────────────────────────────

export interface UseCameraStreamOptions {
  /** Force a specific device. When omitted, the last-used (storageKey) or the
   *  environment-facing camera is opened. */
  deviceId?: string;
  /** Preferred facing when no deviceId is set. @default "environment" */
  facingMode?: CameraFacing;
  width?: number;
  height?: number;
  /** localStorage key used to remember the user's camera choice across sessions. */
  storageKey?: string;
  /** Keep the shared stream alive this long (ms) after the last consumer
   *  unmounts. @default 8000 */
  keepWarmMs?: number;
  /** When false, this consumer neither acquires nor holds the camera. @default true */
  enabled?: boolean;
}

export interface UseCameraStreamResult {
  stream: MediaStream | null;
  /** Increments on each fresh (re)open - handy as an effect dependency. */
  streamId: number;
  status: CameraStatus;
  cameras: CameraInfo[];
  activeDeviceId: string | undefined;
  facingMode: CameraFacing | undefined;
  torchSupported: boolean;
  torchOn: boolean;
  /** Switch to a specific device (persists to storageKey). */
  selectCamera: (deviceId: string) => void;
  /** Toggle the torch/flashlight on the shared track. */
  toggleTorch: () => void;
  /** Re-request the camera after a denial / failure. */
  retry: () => void;
}

/**
 * Subscribe to the process-wide shared camera stream. Each mounted consumer
 * ref-counts the stream; the first triggers `getUserMedia`, the rest reuse it.
 * Attach the returned `stream` to your own `<video>` and run your own decode
 * loop - do NOT stop the stream yourself; the manager owns its lifecycle.
 */
export function useCameraStream(
  options: UseCameraStreamOptions = {}
): UseCameraStreamResult {
  const {
    deviceId,
    facingMode,
    width,
    height,
    storageKey,
    keepWarmMs = DEFAULT_KEEP_WARM_MS,
    enabled = true,
  } = options;

  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Resolve the initial device: an explicit prop wins, otherwise the last-used
  // one from storage (client only).
  const resolvedDeviceId = useMemo(() => {
    if (deviceId) return deviceId;
    if (typeof window === "undefined" || !storageKey) return undefined;
    try {
      return localStorage.getItem(storageKey) ?? undefined;
    } catch {
      return undefined;
    }
  }, [deviceId, storageKey]);

  const req = useMemo<CameraRequest>(
    () => ({ deviceId: resolvedDeviceId, facingMode, width, height }),
    [resolvedDeviceId, facingMode, width, height]
  );

  // Read mutable inputs the stable callbacks need through refs.
  const reqRef = useRef(req);
  reqRef.current = req;
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;
  const keepWarmRef = useRef(keepWarmMs);
  keepWarmRef.current = keepWarmMs;

  // Retain the shared camera for this consumer's lifetime. Subscribing to an
  // external resource (the MediaStream) is exactly what useEffect is for. The
  // signature key re-retains if the requested constraints change (e.g. deviceId
  // passed via props); the keep-warm window makes StrictMode's double-invoke and
  // fast unmount→remount transitions reuse the same stream instead of churning.
  const sigKey = signatureOf(req);
  useEffect(() => {
    if (!enabled) return undefined;
    retain(reqRef.current, storageKeyRef.current);
    return () => release(keepWarmRef.current);
  }, [enabled, sigKey]);

  const selectCamera = useCallback((id: string) => {
    if (storageKeyRef.current) {
      try {
        localStorage.setItem(storageKeyRef.current, id);
      } catch {
        /* localStorage may be unavailable (private browsing, etc.) */
      }
    }
    requestStream({ ...reqRef.current, deviceId: id }, storageKeyRef.current);
  }, []);

  const toggleTorch = useCallback(() => {
    void setTorch(!state.torchOn);
  }, []);

  const retry = useCallback(() => {
    retryStream(reqRef.current, storageKeyRef.current);
  }, []);

  return {
    stream: snap.stream,
    streamId: snap.streamId,
    status: snap.status,
    cameras: snap.cameras,
    activeDeviceId: snap.activeDeviceId,
    facingMode: snap.facingMode,
    torchSupported: snap.torchSupported,
    torchOn: snap.torchOn,
    selectCamera,
    toggleTorch,
    retry,
  };
}

// The shared presentational shell (video + overlays + torch + selector + debug).
// Re-exported here so consumers import both the hook and the surface from one
// path. Placed at the bottom so every binding above is defined before
// camera-surface (which imports from this module) is loaded.
export {
  CameraSurface,
  type CameraSurfaceProps,
  type CameraSurfaceLabels,
  type CameraDebugEntry,
} from "./camera-surface";
