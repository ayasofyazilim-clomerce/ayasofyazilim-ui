/**
 * Longest-edge sizes to attempt, largest first.
 *
 * One size is not enough in either direction. A 12 MP photo of a small QR often
 * decodes *better* downscaled - the finder patterns survive while sensor noise
 * does not - but a QR shot from a distance needs the larger pass to keep enough
 * pixels per module. So the decoder sweeps down and stops at the first hit.
 */
const DECODE_EDGES: [number, number, number] = [1600, 1024, 640];

/**
 * The sizes to try for an image of this size, in order. Never upscales: an
 * image already smaller than a cap is tried at its own size instead, and sizes
 * at or above it are dropped.
 */
export function buildDecodeScales(width: number, height: number): number[] {
  const longest = Math.max(width, height);
  const first = Math.min(longest, DECODE_EDGES[0]);
  const rest = DECODE_EDGES.filter((edge) => edge < first);
  return [first, ...rest];
}
