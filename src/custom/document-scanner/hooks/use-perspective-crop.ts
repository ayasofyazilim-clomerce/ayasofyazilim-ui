import { useCallback } from "react";
import { perspectiveCorrection } from "../utils/perspective-correction";
import { DocumentCorners, Dimensions } from "../types";

export interface UsePerspectiveCropProps {
  videoDimensions: Dimensions;
  imageQuality: number;
  handleImageCrop: (croppedImageBase64: string) => void;
  handleError: (error: string) => void;
}

export function usePerspectiveCrop({
  videoDimensions,
  imageQuality,
  handleImageCrop,
  handleError,
}: UsePerspectiveCropProps) {
  return useCallback(
    async (capturedImage: string, detectedCorners: DocumentCorners) => {
      if (!capturedImage || !detectedCorners) return;

      try {
        const croppedImage = await perspectiveCorrection(
          capturedImage,
          detectedCorners,
          videoDimensions,
          { imageQuality },
        );
        handleImageCrop(croppedImage);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Cropping failed";
        handleError(errorMessage);
      }
    },
    [videoDimensions, imageQuality, handleImageCrop, handleError],
  );
}
