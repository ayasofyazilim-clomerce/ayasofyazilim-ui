import { useCallback } from "react";
import { scanDocument } from "../lib";
import {
  DocumentCorners,
  DocumentScannerCallbacks,
  DetectionSettings,
} from "../types";

export interface UseDocumentCaptureProps {
  videoDimensions: { width: number; height: number };
  callbacks: DocumentScannerCallbacks;
  customDetectionAlgorithm?: (
    image: string,
    dimensions: { width: number; height: number },
  ) => Promise<DocumentCorners | null>;
  detectionSettings: DetectionSettings;
  setCapturedImage: (image: string | null) => void;
  setDetectedCorners: (corners: DocumentCorners | undefined) => void;
  handleError: (error: string) => void;
}

export function useDocumentCapture({
  videoDimensions,
  callbacks,
  customDetectionAlgorithm,
  detectionSettings,
  setCapturedImage,
  setDetectedCorners,
  handleError,
}: UseDocumentCaptureProps) {
  return useCallback(
    (capturedImageBase64: string | null) => {
      if (!capturedImageBase64) return;

      setCapturedImage(capturedImageBase64);
      callbacks.onImageCapture?.(capturedImageBase64);
      callbacks.onScanAttempt?.();

      // Use custom detection algorithm if provided
      if (customDetectionAlgorithm) {
        customDetectionAlgorithm(capturedImageBase64, videoDimensions)
          .then((corners) => {
            if (corners) {
              setDetectedCorners(corners);
              callbacks.onStatusChange?.("detected");
              callbacks.onDocumentDetected?.(corners, capturedImageBase64);
            } else {
              handleError("Document not detected by custom algorithm");
            }
          })
          .catch((error) => {
            const errorMessage = error?.message || "Custom detection failed";
            handleError(errorMessage);
          });
      } else {
        scanDocument(
          capturedImageBase64,
          videoDimensions,
          (corners) => {
            setDetectedCorners(corners);
            callbacks.onStatusChange?.("detected");
            callbacks.onDocumentDetected?.(corners, capturedImageBase64);
          },
          (error) => {
            handleError(error);
          },
          detectionSettings,
        );
      }
    },
    [
      videoDimensions,
      callbacks,
      customDetectionAlgorithm,
      detectionSettings,
      setCapturedImage,
      setDetectedCorners,
      handleError,
    ],
  );
}
