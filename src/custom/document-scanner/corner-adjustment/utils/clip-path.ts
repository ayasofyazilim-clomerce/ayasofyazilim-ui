import { DocumentCorners } from "../../types";

export function generateClipPath(
  corners: DocumentCorners,
  videoDimensions: { width: number; height: number },
): string {
  const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } =
    corners;

  // Convert pixel coordinates to percentages
  const toPercent = (x: number, y: number) => ({
    x: (x / videoDimensions.width) * 100,
    y: (y / videoDimensions.height) * 100,
  });

  const tl = toPercent(topLeftCorner.x, topLeftCorner.y);
  const tr = toPercent(topRightCorner.x, topRightCorner.y);
  const br = toPercent(bottomRightCorner.x, bottomRightCorner.y);
  const bl = toPercent(bottomLeftCorner.x, bottomLeftCorner.y);

  return `polygon(${tl.x}% ${tl.y}%, ${tr.x}% ${tr.y}%, ${br.x}% ${br.y}%, ${bl.x}% ${bl.y}%)`;
}
