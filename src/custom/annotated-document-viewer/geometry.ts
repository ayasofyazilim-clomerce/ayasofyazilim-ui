import type { AnnotationBox, AnnotationRect } from "./types";

/**
 * Maps a page-fraction rect onto a page image that is turned `rotation` degrees counter-clockwise
 * relative to the rect's frame (for example, an upright raster of a scan whose boxes were measured
 * on the original upload).
 *
 * Two opposite corners are mapped and the result is re-ordered to min/max. Fractions are
 * dimension-independent, so the aspect swap of a 90/270 turn is implicit. The angle is normalised
 * (−90 is 270, 450 is 90); a non-cardinal angle returns the rect unchanged.
 */
export function rotateRect(
  rect: AnnotationRect,
  rotation: number
): AnnotationRect {
  const [x0, y0, x1, y1] = rect;
  const angle = ((rotation % 360) + 360) % 360;
  let corners: [number, number, number, number];
  if (angle === 90) corners = [y0, 1 - x0, y1, 1 - x1];
  else if (angle === 180) corners = [1 - x0, 1 - y0, 1 - x1, 1 - y1];
  else if (angle === 270) corners = [1 - y0, x0, 1 - y1, x1];
  else return [x0, y0, x1, y1];
  const [ax, ay, bx, by] = corners;
  return [
    Math.min(ax, bx),
    Math.min(ay, by),
    Math.max(ax, bx),
    Math.max(ay, by),
  ];
}

function isUsableSize(
  size: { width: number; height: number } | undefined
): size is { width: number; height: number } {
  return (
    !!size &&
    Number.isFinite(size.width) &&
    Number.isFinite(size.height) &&
    size.width > 0 &&
    size.height > 0
  );
}

/**
 * The box's rect as 0–1 fractions of the page image on screen, corners ordered min/max.
 *
 * A box with a `frame` is divided by it first (`"natural"` uses `natural`, the page image's
 * natural size); then the box's `rotation` is applied with {@link rotateRect}. Returns `null` when
 * the frame cannot be resolved yet: `"natural"` without a known, non-zero `natural` size, or an
 * explicit frame with a zero or non-finite side.
 */
export function toPageFraction(
  box: AnnotationBox,
  natural?: { width: number; height: number }
): AnnotationRect | null {
  const { rect, frame, rotation = 0 } = box;
  const size =
    frame === undefined
      ? { width: 1, height: 1 }
      : frame === "natural"
        ? natural
        : frame;
  if (!isUsableSize(size)) return null;
  const [x0, y0, x1, y1] = rect;
  const fx0 = x0 / size.width;
  const fy0 = y0 / size.height;
  const fx1 = x1 / size.width;
  const fy1 = y1 / size.height;
  return rotateRect(
    [
      Math.min(fx0, fx1),
      Math.min(fy0, fy1),
      Math.max(fx0, fx1),
      Math.max(fy0, fy1),
    ],
    rotation
  );
}

/**
 * The CSS stroke width, in px, that keeps a mark `base` px wide on screen at `zoom`: the viewport
 * scales the page (and the overlay with it) by `zoom`, so the stroke is divided by it. Below the
 * point where `base / zoom` would exceed `cap`, the width is held at `cap`, so a page zoomed out
 * past fit does not grow heavy outlines.
 */
export function markStrokeWidth(zoom: number, base = 2, cap = 2.5): number {
  return Math.min(base / zoom, cap);
}
