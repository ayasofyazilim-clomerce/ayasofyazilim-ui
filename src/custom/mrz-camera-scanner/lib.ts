import cv, { Mat } from "opencv-ts";
import {
  findDocumentCornersAdvanced,
  findDocumentSimple,
  scoreCornersQuality,
} from "../document-scanner/lib";
import type { DocumentCorners } from "../document-scanner/types";

/**
 * Vision helpers for the MRZ camera scanner.
 *
 * The flow is:
 *   1. find the document (its four corners) in the live frame,
 *   2. once a sharp document is present, OCR it to confirm an MRZ is there,
 *   3. accumulate a confidence score and capture when it crosses a target.
 *
 * Corner detection reuses the document-scanner's OpenCV routines so we share a
 * single, battle-tested implementation.
 */

interface CvWithRuntime {
  Mat?: unknown;
  onRuntimeInitialized?: () => void;
}

/** True once the OpenCV WASM runtime has finished initialising. */
export function isOpenCVReady(): boolean {
  return (
    typeof cv !== "undefined" &&
    typeof (cv as unknown as CvWithRuntime).Mat === "function"
  );
}

/**
 * Resolves once OpenCV is ready. `opencv-ts` loads the WASM module asynchronously
 * on import, so callers must await this before the first `cv.*` call.
 */
export function ensureOpenCVReady(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (isOpenCVReady()) {
      resolve();
      return;
    }
    const runtime = cv as unknown as CvWithRuntime;
    const interval = setInterval(() => {
      if (isOpenCVReady()) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
    try {
      runtime.onRuntimeInitialized = () => {
        clearInterval(interval);
        resolve();
      };
    } catch {
      /* some builds expose a read-only hook - polling covers it */
    }
  });
}

/** A rectangle normalised (0–1) to the frame it was found in. */
export interface NormalizedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentDetection {
  /** Corners in pixel coordinates of the analysed canvas. */
  corners: DocumentCorners;
  /** Detection quality, 0–1 (from the document-scanner's scorer). */
  score: number;
  /** Axis-aligned bounding box of the corners, normalised to the canvas. */
  box: NormalizedBox;
}

/**
 * Detect a document (its four corners) in a canvas already drawn with a
 * downscaled video frame. Returns null if no quad is found. Reuses the
 * document-scanner's corner finders. All OpenCV matrices are released.
 */
export function detectDocument(
  canvas: HTMLCanvasElement
): DocumentDetection | null {
  if (!isOpenCVReady()) return null;
  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return null;

  let src: Mat | null = null;
  try {
    src = cv.imread(canvas);
    let corners = findDocumentSimple(src, w, h);
    if (!corners) corners = findDocumentCornersAdvanced(src, w, h);
    if (!corners) return null;

    const score = scoreCornersQuality(corners, w, h);
    const xs = [
      corners.topLeftCorner.x,
      corners.topRightCorner.x,
      corners.bottomRightCorner.x,
      corners.bottomLeftCorner.x,
    ];
    const ys = [
      corners.topLeftCorner.y,
      corners.topRightCorner.y,
      corners.bottomRightCorner.y,
      corners.bottomLeftCorner.y,
    ];
    const minX = Math.max(0, Math.min(...xs));
    const minY = Math.max(0, Math.min(...ys));
    const maxX = Math.min(w, Math.max(...xs));
    const maxY = Math.min(h, Math.max(...ys));

    return {
      corners,
      score,
      box: {
        x: minX / w,
        y: minY / h,
        width: (maxX - minX) / w,
        height: (maxY - minY) / h,
      },
    };
  } catch {
    return null;
  } finally {
    src?.delete();
  }
}

/**
 * Returns the variance of the Laplacian of the (grayscale) frame - the standard
 * focus measure. Higher means sharper; a low value indicates a blurry image.
 * The frame is downscaled to a fixed width first so the value is comparable
 * regardless of source resolution. Returns 0 if OpenCV isn't ready.
 */
export function measureSharpness(
  source: HTMLCanvasElement,
  normalizeWidth = 480
): number {
  if (!isOpenCVReady()) return 0;
  if (!source.width || !source.height) return 0;

  const mats: Mat[] = [];
  const track = <T extends Mat>(m: T): T => {
    mats.push(m);
    return m;
  };

  try {
    const src = track(cv.imread(source));

    let analysed: Mat = src;
    if (source.width > normalizeWidth) {
      const scale = normalizeWidth / source.width;
      const resized = track(new cv.Mat());
      cv.resize(
        src,
        resized,
        new cv.Size(
          Math.round(source.width * scale),
          Math.round(source.height * scale)
        ),
        0,
        0,
        cv.INTER_AREA
      );
      analysed = resized;
    }

    const gray = track(new cv.Mat());
    cv.cvtColor(analysed, gray, cv.COLOR_RGBA2GRAY);

    const laplacian = track(new cv.Mat());
    cv.Laplacian(gray, laplacian, cv.CV_64F, 1, 1, 0, cv.BORDER_DEFAULT);

    const mean = track(new cv.Mat());
    const stddev = track(new cv.Mat());
    cv.meanStdDev(laplacian, mean, stddev);

    const sd = stddev.doubleAt(0, 0);
    return sd * sd;
  } catch {
    return 0;
  } finally {
    mats.forEach((m) => m.delete());
  }
}
