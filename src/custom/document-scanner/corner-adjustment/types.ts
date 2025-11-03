import { PointerEvent } from "react";
import { DocumentCorners } from "../types";

export interface CornerAdjustmentProps {
  capturedImage: string;
  detectedCorners: DocumentCorners;
  videoDimensions: { width: number; height: number };

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
  offset: { x: number; y: number };
}

export interface CornerHandleProps {
  cornerKey: string;
  corner: { x: number; y: number };
  videoDimensions: { width: number; height: number };
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
