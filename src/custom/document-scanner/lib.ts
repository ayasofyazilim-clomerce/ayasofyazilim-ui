import { createScanner } from '../tscanify/browser';
import { DEFAULT_MAX_DOCUMENT_SIZE, DEFAULT_MIN_DOCUMENT_SIZE } from './consts';
import { DocumentCorners } from './types';
import cv, { Mat } from "opencv-ts";

export async function scanDocument(
  imageBase64: string,
  videoDimensions: { width: number; height: number },
  onSuccess: (corners: DocumentCorners) => void,
  onError: (error: string) => void,
  options?: {
    minDocumentSize?: number;
    maxDocumentSize?: number;
    detectionSensitivity?: number;
    detectionConfidence?: number;
  }
) {
  try {
    const scanner = createScanner();
    const inputCanvas = document.createElement('canvas');
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        try {
          const ctx = inputCanvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          inputCanvas.width = img.width;
          inputCanvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const src = cv.imread(inputCanvas);
          let detectedCorners: DocumentCorners | null = null;

          try {
            // Use configurable detection settings
            const minDocumentSize =
              options?.minDocumentSize ?? DEFAULT_MIN_DOCUMENT_SIZE;
            const maxDocumentSize =
              options?.maxDocumentSize ?? DEFAULT_MAX_DOCUMENT_SIZE;

            // Try different detection methods
            detectedCorners = findDocumentSimple(src, img.width, img.height);

            if (!detectedCorners) {
              detectedCorners = scanner.findDocumentCorners(src);
            }

            if (!detectedCorners) {
              detectedCorners = findDocumentCornersAdvanced(
                src,
                img.width,
                img.height
              );
            }

            if (detectedCorners) {
              // Validate corners with configurable sizes
              const {
                topLeftCorner,
                topRightCorner,
                bottomRightCorner,
                bottomLeftCorner,
              } = detectedCorners;
              const width = Math.abs(topRightCorner.x - topLeftCorner.x);
              const height = Math.abs(bottomLeftCorner.y - topLeftCorner.y);
              const minSize = Math.min(img.width, img.height) * minDocumentSize;
              const maxSize = Math.min(img.width, img.height) * maxDocumentSize;

              if (
                width >= minSize &&
                height >= minSize &&
                width <= maxSize &&
                height <= maxSize
              ) {
                // Scale corners to video dimensions
                const scaledCorners = {
                  topLeftCorner: {
                    x: (topLeftCorner.x / img.width) * videoDimensions.width,
                    y: (topLeftCorner.y / img.height) * videoDimensions.height,
                  },
                  topRightCorner: {
                    x: (topRightCorner.x / img.width) * videoDimensions.width,
                    y: (topRightCorner.y / img.height) * videoDimensions.height,
                  },
                  bottomRightCorner: {
                    x:
                      (bottomRightCorner.x / img.width) * videoDimensions.width,
                    y:
                      (bottomRightCorner.y / img.height) *
                      videoDimensions.height,
                  },
                  bottomLeftCorner: {
                    x: (bottomLeftCorner.x / img.width) * videoDimensions.width,
                    y:
                      (bottomLeftCorner.y / img.height) *
                      videoDimensions.height,
                  },
                };
                onSuccess(scaledCorners);
              }
            }
          } finally {
            // Always cleanup OpenCV resources
            src.delete();
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageBase64;
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred during document scanning';
    onError(errorMessage);
  }
}

// Document scanning function

// Simple document detection fallback
export function findDocumentSimple(
  src: Mat,
  width: number,
  height: number
): DocumentCorners | null {
  try {
    const gray = new cv.Mat();
    const binary = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    cv.findContours(
      binary,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      const minArea = width * height * 0.1;

      if (area > minArea) {
        const approx = new cv.Mat();
        const peri = cv.arcLength(contour, true);
        cv.approxPolyDP(contour, approx, 0.02 * peri, true);

        if (approx.rows === 4) {
          const points: Array<{ x: number, y: number }> = [];
          for (let j = 0; j < 4; j++) {
            const point = approx.data32S;
            points.push({ x: point[j * 2] || 0, y: point[j * 2 + 1] || 0 });
          }

          // Sort points to match expected corners
          points.sort((a, b) => a.y - b.y);
          const topPoints = points.slice(0, 2).sort((a, b) => a.x - b.x);
          const bottomPoints = points.slice(2, 4).sort((a, b) => a.x - b.x);

          const corners = {
            topLeftCorner: topPoints[0],
            topRightCorner: topPoints[1],
            bottomRightCorner: bottomPoints[1],
            bottomLeftCorner: bottomPoints[0],
          };

          approx.delete();
          contour.delete();
          gray.delete();
          binary.delete();
          contours.delete();
          hierarchy.delete();

          return corners as DocumentCorners
        }

        approx.delete();
      }
      contour.delete();
    }

    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();

    return null;
  } catch {
    return null;
  }
}

// Advanced document detection
export function findDocumentCornersAdvanced(
  src: Mat,
  width: number,
  height: number
): DocumentCorners | null {

  try {
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    const approaches = [
      {
        name: 'OTSU + Gaussian',
        process: (input: any) => {
          const blurred = new cv.Mat();
          const binary = new cv.Mat();
          cv.GaussianBlur(input, blurred, new cv.Size(9, 9), 0, 0, 0);
          cv.threshold(
            blurred,
            binary,
            0,
            255,
            cv.THRESH_BINARY + cv.THRESH_OTSU
          );
          blurred.delete();
          return binary;
        },
      },
      {
        name: 'Adaptive Threshold',
        process: (input: Mat) => {
          const binary = new cv.Mat();
          cv.adaptiveThreshold(
            input,
            binary,
            255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY,
            15,
            10
          );
          return binary;
        },
      },
    ];

    let bestCorners: DocumentCorners | null = null;
    let bestScore = 0;

    Array.from(approaches).forEach((approach) => {
      const binary = approach.process(gray);
      const corners = findCornersFromBinary(binary, width, height);

      if (corners) {
        const score = scoreCornersQuality(corners, width, height);
        if (score > bestScore) {
          bestScore = score;
          bestCorners = corners;
        }
      }

      binary.delete();
    });

    gray.delete();
    return bestCorners;
  } catch {
    return null;
  }
}

export function findCornersFromBinary(
  binary: Mat,
  width: number,
  height: number
): DocumentCorners | null {
  try {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      binary,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    let bestCorners: DocumentCorners | null = null;
    let bestArea = 0;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      const minArea = width * height * 0.05;

      if (area > minArea && area > bestArea) {
        const approx = new cv.Mat();
        const peri = cv.arcLength(contour, true);
        cv.approxPolyDP(contour, approx, 0.02 * peri, true);

        if (approx.rows === 4) {
          const points: Array<{ x: number; y: number }> = [];
          for (let j = 0; j < 4; j++) {
            const point = approx.data32S;
            points.push({ x: point[j * 2] || 0, y: point[j * 2 + 1] || 0 });
          }

          points.sort((a, b) => a.y - b.y);
          const topPoints = points.slice(0, 2).sort((a, b) => a.x - b.x);
          const bottomPoints = points.slice(2, 4).sort((a, b) => a.x - b.x);

          bestCorners = {
            topLeftCorner: topPoints[0] as DocumentCorners["topLeftCorner"],
            topRightCorner: topPoints[1] as DocumentCorners["topRightCorner"],
            bottomRightCorner: bottomPoints[1] as DocumentCorners["bottomRightCorner"],
            bottomLeftCorner: bottomPoints[0] as DocumentCorners["bottomLeftCorner"],
          };
          bestArea = area;
        }

        approx.delete();
      }
      contour.delete();
    }

    contours.delete();
    hierarchy.delete();
    return bestCorners;
  } catch {
    return null;
  }
}

export function scoreCornersQuality(
  corners: DocumentCorners,
  width: number,
  height: number
): number {
  try {
    const {
      topLeftCorner,
      topRightCorner,
      bottomRightCorner,
      bottomLeftCorner,
    } = corners;

    // Calculate all four side lengths for more accurate measurement
    const topWidth = Math.abs(topRightCorner.x - topLeftCorner.x);
    const bottomWidth = Math.abs(bottomRightCorner.x - bottomLeftCorner.x);
    const leftHeight = Math.abs(bottomLeftCorner.y - topLeftCorner.y);
    const rightHeight = Math.abs(bottomRightCorner.y - topRightCorner.y);

    // Use average width and height for better accuracy
    const avgWidth = (topWidth + bottomWidth) / 2;
    const avgHeight = (leftHeight + rightHeight) / 2;
    const area = avgWidth * avgHeight;

    // Calculate how much the shape deviates from a perfect rectangle
    const widthDifference =
      Math.abs(topWidth - bottomWidth) / Math.max(topWidth, bottomWidth);
    const heightDifference =
      Math.abs(leftHeight - rightHeight) / Math.max(leftHeight, rightHeight);
    const rectangularityScore = 1 - (widthDifference + heightDifference) / 2;

    // Area score (normalized)
    const maxArea = width * height;
    const areaScore = Math.min(area / (maxArea * 0.8), 1);

    // Aspect ratio score (favor reasonable document proportions)
    const aspectRatio = avgWidth / avgHeight;
    const aspectScore = aspectRatio > 0.3 && aspectRatio < 3 ? 1 : 0.5;

    // Size validation score (penalize very small or very large detections)
    const minSize = Math.min(width, height) * 0.15; // At least 15% of image
    const maxSize = Math.min(width, height) * 0.95; // At most 95% of image
    const sizeScore =
      avgWidth >= minSize &&
        avgHeight >= minSize &&
        avgWidth <= maxSize &&
        avgHeight <= maxSize
        ? 1
        : 0.3;

    // Combine all scores with weights
    return (
      areaScore * 0.3 +
      rectangularityScore * 0.4 +
      aspectScore * 0.2 +
      sizeScore * 0.1
    );
  } catch {
    return 0;
  }
}

// Adjustable corners component
