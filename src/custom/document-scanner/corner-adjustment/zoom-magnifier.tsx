import { memo, useMemo } from "react";
import { DocumentCorners } from "../types";

interface ZoomMagnifierProps {
  capturedImage: string;
  detectedCorners: DocumentCorners;
  videoDimensions: { width: number; height: number };
  containerDimensions: { width: number; height: number };
  draggedCorner: string | null;
  zoomLevel?: number;
  magnifierSize?: number;
}

export const ZoomMagnifier = memo<ZoomMagnifierProps>(
  ({
    capturedImage,
    detectedCorners,
    videoDimensions,
    containerDimensions,
    draggedCorner,
    zoomLevel = 3,
    magnifierSize = 100,
  }) => {
    const position = useMemo(() => {
      if (!draggedCorner) return null;

      const margin = 8;
      let left = 0;
      let top = 0;

      // Position opposite to the corner being dragged
      switch (draggedCorner) {
        case "topLeftCorner":
          left = containerDimensions.width - magnifierSize - margin;
          top = margin;
          break;
        case "topRightCorner":
          left = margin;
          top = margin;
          break;
        case "bottomLeftCorner":
          left = containerDimensions.width - magnifierSize - margin;
          top = containerDimensions.height - magnifierSize - margin;
          break;
        case "bottomRightCorner":
          left = margin;
          top = containerDimensions.height - magnifierSize - margin;
          break;
        default:
          return null;
      }

      return { left, top };
    }, [draggedCorner, containerDimensions, magnifierSize]);

    const backgroundStyle = useMemo(() => {
      if (!position || !draggedCorner) return {};

      // Get the active corner position
      const activeCorner =
        detectedCorners[draggedCorner as keyof DocumentCorners];
      if (!activeCorner) return {};

      // Convert corner position from video dimensions to container dimensions
      const cornerX =
        (activeCorner.x / videoDimensions.width) * containerDimensions.width;
      const cornerY =
        (activeCorner.y / videoDimensions.height) * containerDimensions.height;

      // Calculate the background position to center the zoom on active corner
      const bgX = -cornerX * zoomLevel + magnifierSize / 2;
      const bgY = -cornerY * zoomLevel + magnifierSize / 2;

      return {
        backgroundImage: `url(${capturedImage})`,
        backgroundSize: `${containerDimensions.width * zoomLevel}px ${containerDimensions.height * zoomLevel}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: "no-repeat",
      };
    }, [
      capturedImage,
      detectedCorners,
      draggedCorner,
      videoDimensions,
      containerDimensions,
      zoomLevel,
      magnifierSize,
      position,
    ]);

    if (!position || !draggedCorner) return null;

    return (
      <div
        className="absolute border-2 border-white rounded-md shadow-lg pointer-events-none z-30"
        style={{
          left: position.left,
          top: position.top,
          width: magnifierSize,
          height: magnifierSize,
          ...backgroundStyle,
        }}
      >
        {/* Crosshair overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-[5px] rounded-full border border-primary bg-white absolute" />
          </div>
        </div>
      </div>
    );
  },
);

ZoomMagnifier.displayName = "ZoomMagnifier";
