import { ReactNode, PointerEvent } from "react";
import { WebcamProps } from "../webcam";

// Core types
export interface DocumentCorners {
  topLeftCorner: { x: number; y: number };
  topRightCorner: { x: number; y: number };
  bottomRightCorner: { x: number; y: number };
  bottomLeftCorner: { x: number; y: number };
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

// Callback types
export interface DocumentScannerCallbacks {
  onDocumentCropped?: (croppedImage: string) => void;
  onDocumentDetected?: (
    corners: DocumentCorners,
    capturedImage: string,
  ) => void;
  onCornersChanged?: (corners: DocumentCorners) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: ScannerStatus) => void;
  onCameraReady?: (dimensions: Dimensions) => void;
  onScanAttempt?: () => void;
  onImageCapture?: (image: string) => void;
}

export type ScannerStatus =
  | "scanning"
  | "detected"
  | "cropped"
  | "error"
  | "processing";

export interface DetectionSettings {
  minDocumentSize: number;
  maxDocumentSize: number;
  detectionConfidence: number;
}

// Main component props
export interface DocumentScannerProps {
  // Core callbacks
  onDocumentCropped?: (croppedImage: string) => void;
  onDocumentDetected?: (
    corners: DocumentCorners,
    capturedImage: string,
  ) => void;
  onCornersChanged?: (corners: DocumentCorners) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: ScannerStatus) => void;
  onCameraReady?: (dimensions: Dimensions) => void;
  onScanAttempt?: () => void;
  onImageCapture?: (image: string) => void;

  // Basic configuration
  className?: string;
  captureInterval?: number;

  // Feature toggles
  allowCrop?: boolean;
  allowRetry?: boolean;
  allowCornerAdjustment?: boolean;
  allowCameraSwitch?: boolean;
  showWebcamControls?: boolean;

  // UI Text customization
  cropButtonText?: string;
  retryButtonText?: string;

  // Visual styling
  cornerColor?: string;
  cornerTouchAreaSize?: number;

  // Detection settings
  minDocumentSize?: number;
  maxDocumentSize?: number;
  detectionConfidence?: number;

  // Image processing
  imageQuality?: number;

  // Magnifier settings
  showMagnifier?: boolean;
  magnifierSize?: number;
  zoomLevel?: number;

  // Advanced settings
  customDetectionAlgorithm?: (
    image: string,
    dimensions: Dimensions,
  ) => Promise<DocumentCorners | null>;

  // Custom components
  customControls?: ReactNode;
  customOverlay?: ReactNode;

  // Webcam interface
  interfaceLocation?: WebcamProps["interfaceLocation"];
  showBorder?: WebcamProps["showBorder"];
}

// Corner adjustment types
export interface CornerAdjustmentProps {
  capturedImage: string;
  detectedCorners: DocumentCorners;
  videoDimensions: Dimensions;
  onCornersChange: (corners: DocumentCorners) => void;
  onCrop: () => void;
  onRetry: () => void;

  // Styling props
  cornerColor?: string;
  cornerTouchAreaSize?: number;

  // Feature toggles
  allowCrop?: boolean;
  allowRetry?: boolean;

  // Text customization
  cropButtonText?: string;
  retryButtonText?: string;

  // Magnifier settings
  showMagnifier?: boolean;
  magnifierSize?: number;
  zoomLevel?: number;
}

export interface DragState {
  isDragging: string | null;
  offset: Position;
}

export interface CornerHandleProps {
  cornerKey: string;
  corner: Position;
  videoDimensions: Dimensions;
  isDragging: boolean;
  cornerColor: string;
  cornerTouchAreaSize: number;
  onDragStart: (cornerKey: string, event: PointerEvent) => void;
}

export interface ActionButtonsProps {
  allowCrop: boolean;
  allowRetry: boolean;
  cropButtonText: string;
  retryButtonText: string;
  onCrop: () => void;
  onRetry: () => void;
}

export interface ZoomMagnifierProps {
  capturedImage: string;
  detectedCorners: DocumentCorners;
  videoDimensions: Dimensions;
  containerDimensions: Dimensions;
  draggedCorner: string | null;
  zoomLevel?: number;
  magnifierSize?: number;
}

// Hook types
export interface UseDocumentScannerReturn {
  videoDimensions: Dimensions;
  detectedCorners: DocumentCorners | undefined;
  capturedImage: string | null;
  handleVideoReady: (dimensions: Dimensions) => void;
  handleCornersChange: (newCorners: DocumentCorners) => void;
  handleError: (error: string) => void;
  handleImageCrop: (croppedImageBase64: string) => void;
  handleRetry: () => void;
  setCapturedImage: (image: string | null) => void;
  setDetectedCorners: (corners: DocumentCorners | undefined) => void;
}

export interface UseDocumentCaptureProps {
  videoDimensions: Dimensions;
  callbacks: DocumentScannerCallbacks;
  customDetectionAlgorithm?: (
    image: string,
    dimensions: Dimensions,
  ) => Promise<DocumentCorners | null>;
  detectionSettings: DetectionSettings;
  setCapturedImage: (image: string | null) => void;
  setDetectedCorners: (corners: DocumentCorners | undefined) => void;
  handleError: (error: string) => void;
}

export interface UsePerspectiveCropProps {
  videoDimensions: Dimensions;
  imageQuality: number;
  handleImageCrop: (croppedImageBase64: string) => void;
  handleError: (error: string) => void;
}
