import { memo, useMemo, useRef, useLayoutEffect, useState } from "react";
import { ActionButtons } from "./action-buttons";
import { CornerHandle } from "./corner-handle";
import { ZoomMagnifier } from "./zoom-magnifier";
import { useCornerDrag } from "./hooks/use-corner-drag";
import { generateClipPath } from "./utils/clip-path";
import { CornerAdjustmentProps } from "../types";

export const CornerAdjustment = memo<CornerAdjustmentProps>(
  ({
    capturedImage,
    detectedCorners,
    videoDimensions,
    onCornersChange,
    onCrop,
    onRetry,
    cornerColor = "bg-white/80",
    cornerTouchAreaSize = 20,
    allowCrop = true,
    allowRetry = true,
    cropButtonText = "Crop",
    retryButtonText = "Scan Again",
    showMagnifier = true,
    magnifierSize = 100,
    zoomLevel = 2,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerDimensions, setContainerDimensions] = useState({
      width: 0,
      height: 0,
    });

    const {
      dragState,
      handleCornerDragStart,
      handleCornerDrag,
      handleCornerDragEnd,
    } = useCornerDrag(detectedCorners, videoDimensions, onCornersChange);

    // Update container dimensions
    useLayoutEffect(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    }, []);

    const clipPath = useMemo(
      () => generateClipPath(detectedCorners, videoDimensions),
      [detectedCorners, videoDimensions]
    );

    const cornerEntries = useMemo(
      () => Object.entries(detectedCorners),
      [detectedCorners]
    );

    return (
      <div
        ref={containerRef}
        className="corner-adjustment-container size-full flex items-center justify-center relative bg-red-500"
        onPointerMove={handleCornerDrag}
        onPointerUp={handleCornerDragEnd}
        onPointerLeave={handleCornerDragEnd}
      >
        {/* Original image */}
        <img
          src={capturedImage}
          alt="Original"
          className="h-auto w-full object-contain absolute top-0 left-0 opacity-50"
          draggable={false}
        />
        {/* Clipped image */}
        <img
          src={capturedImage}
          alt="Document preview"
          className="h-full w-full object-contain"
          style={{ clipPath }}
          draggable={false}
        />

        {/* Zoom Magnifier */}
        {showMagnifier && (
          <ZoomMagnifier
            capturedImage={capturedImage}
            detectedCorners={detectedCorners}
            videoDimensions={videoDimensions}
            containerDimensions={containerDimensions}
            draggedCorner={dragState.isDragging}
            zoomLevel={zoomLevel}
            magnifierSize={magnifierSize}
          />
        )}

        {/* Corner handles */}
        {cornerEntries.map(([cornerKey, corner]) => (
          <CornerHandle
            key={cornerKey}
            cornerKey={cornerKey}
            corner={corner}
            videoDimensions={videoDimensions}
            isDragging={dragState.isDragging === cornerKey}
            cornerColor={cornerColor}
            cornerTouchAreaSize={cornerTouchAreaSize}
            onDragStart={handleCornerDragStart}
          />
        ))}

        {/* Action buttons */}
        {!dragState.isDragging && (
          <ActionButtons
            allowCrop={allowCrop}
            allowRetry={allowRetry}
            cropButtonText={cropButtonText}
            retryButtonText={retryButtonText}
            onCrop={onCrop}
            onRetry={onRetry}
          />
        )}
      </div>
    );
  }
);

CornerAdjustment.displayName = "CornerAdjustment";
