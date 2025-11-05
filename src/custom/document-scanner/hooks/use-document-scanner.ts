import { useCallback, useState } from "react";
import { DocumentCorners, DocumentScannerCallbacks } from "../types";
import { DEFAULT_VIDEO_DIMENSIONS } from "../consts";

export interface UseDocumentScannerReturn {
  videoDimensions: { width: number; height: number };
  detectedCorners: DocumentCorners | undefined;
  capturedImage: string | null;
  handleVideoReady: (dimensions: { width: number; height: number }) => void;
  handleCornersChange: (newCorners: DocumentCorners) => void;
  handleError: (error: string) => void;
  handleImageCrop: (croppedImageBase64: string) => void;
  handleRetry: () => void;
  setCapturedImage: (image: string | null) => void;
  setDetectedCorners: (corners: DocumentCorners | undefined) => void;
}

export function useDocumentScanner(
  callbacks: DocumentScannerCallbacks
): UseDocumentScannerReturn {
  const [videoDimensions, setVideoDimensions] = useState(
    DEFAULT_VIDEO_DIMENSIONS
  );
  const [detectedCorners, setDetectedCorners] = useState<
    DocumentCorners | undefined
  >();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleVideoReady = useCallback(
    (dimensions: { width: number; height: number }) => {
      setVideoDimensions(dimensions);
      callbacks.onStatusChange?.("scanning");
      callbacks.onCameraReady?.(dimensions);
    },
    [callbacks]
  );

  const handleCornersChange = useCallback(
    (newCorners: DocumentCorners) => {
      setDetectedCorners(newCorners);
      callbacks.onCornersChanged?.(newCorners);
    },
    [callbacks]
  );

  const handleError = useCallback(
    (error: string) => {
      callbacks.onStatusChange?.("error");
      callbacks.onError?.(error);
    },
    [callbacks]
  );

  const handleImageCrop = useCallback(
    (croppedImageBase64: string) => {
      callbacks.onStatusChange?.("cropped");
      callbacks.onDocumentCropped?.(croppedImageBase64);
    },
    [callbacks]
  );

  const handleRetry = useCallback(() => {
    setDetectedCorners(undefined);
    setCapturedImage(null);
    callbacks.onStatusChange?.("scanning");
  }, [callbacks]);

  return {
    videoDimensions,
    detectedCorners,
    capturedImage,
    handleVideoReady,
    handleCornersChange,
    handleError,
    handleImageCrop,
    handleRetry,
    setCapturedImage,
    setDetectedCorners,
  };
}
