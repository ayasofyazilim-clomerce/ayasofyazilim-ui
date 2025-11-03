import cv from "opencv-ts";
import type { Mat } from "opencv-ts";
import { DocumentCorners } from "../types";

export interface PerspectiveCorrectionOptions {
  imageQuality: number;
}

export function perspectiveCorrection(
  imageBase64: string,
  corners: DocumentCorners,
  videoDimensions: { width: number; height: number },
  options: PerspectiveCorrectionOptions,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          // Create canvas and get image data
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0);

          // Create OpenCV matrices
          const src = cv.imread(canvas);

          // Scale corners from video dimensions to actual image dimensions
          const scaleX = img.width / videoDimensions.width;
          const scaleY = img.height / videoDimensions.height;

          // Source points (detected corners scaled to image size)
          const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            corners.topLeftCorner.x * scaleX,
            corners.topLeftCorner.y * scaleY,
            corners.topRightCorner.x * scaleX,
            corners.topRightCorner.y * scaleY,
            corners.bottomRightCorner.x * scaleX,
            corners.bottomRightCorner.y * scaleY,
            corners.bottomLeftCorner.x * scaleX,
            corners.bottomLeftCorner.y * scaleY,
          ]);

          // Calculate output dimensions
          const { outputWidth, outputHeight } = calculateOutputDimensions(
            corners,
            scaleX,
            scaleY,
          );

          // Destination points (rectangle)
          const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0,
            0,
            outputWidth,
            0,
            outputWidth,
            outputHeight,
            0,
            outputHeight,
          ]);

          // Get perspective transform matrix
          const transformMatrix = cv.getPerspectiveTransform(
            srcPoints,
            dstPoints,
          );

          // Apply perspective transformation
          const dst = new cv.Mat();
          cv.warpPerspective(
            src,
            dst,
            transformMatrix,
            new cv.Size(outputWidth, outputHeight),
          );

          // Convert back to canvas and get base64
          const outputCanvas = document.createElement("canvas");
          cv.imshow(outputCanvas, dst);
          const croppedBase64 = outputCanvas.toDataURL(
            "image/jpeg",
            options.imageQuality,
          );

          // Cleanup OpenCV matrices
          cleanupMatrices([src, dst, srcPoints, dstPoints, transformMatrix]);

          resolve(croppedBase64);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageBase64;
    } catch (error) {
      reject(error);
    }
  });
}

function calculateOutputDimensions(
  corners: DocumentCorners,
  scaleX: number,
  scaleY: number,
): { outputWidth: number; outputHeight: number } {
  const distance = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
  ) => Math.sqrt(((p2.x - p1.x) * scaleX) ** 2 + ((p2.y - p1.y) * scaleY) ** 2);

  const topWidth = distance(corners.topLeftCorner, corners.topRightCorner);
  const bottomWidth = distance(
    corners.bottomLeftCorner,
    corners.bottomRightCorner,
  );
  const leftHeight = distance(corners.topLeftCorner, corners.bottomLeftCorner);
  const rightHeight = distance(
    corners.topRightCorner,
    corners.bottomRightCorner,
  );

  return {
    outputWidth: Math.max(topWidth, bottomWidth),
    outputHeight: Math.max(leftHeight, rightHeight),
  };
}

function cleanupMatrices(matrices: Mat[]): void {
  matrices.forEach((matrix) => {
    matrix.delete();
  });
}
