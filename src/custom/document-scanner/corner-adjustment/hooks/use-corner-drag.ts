import { useCallback, useState, PointerEvent } from "react";
import { DocumentCorners } from "../../types";
import { DragState } from "../types";

export function useCornerDrag(
  detectedCorners: DocumentCorners,
  videoDimensions: { width: number; height: number },
  onCornersChange: (corners: DocumentCorners) => void
) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: null,
    offset: { x: 0, y: 0 },
  });

  const handleCornerDragStart = useCallback(
    (cornerKey: string, event: PointerEvent) => {
      event.preventDefault();

      const rect = event.currentTarget.getBoundingClientRect();
      const containerRect = event.currentTarget
        .closest(".corner-adjustment-container")
        ?.getBoundingClientRect();

      if (containerRect) {
        const newDragState = {
          isDragging: cornerKey,
          offset: {
            x: event.clientX - rect.left - rect.width / 2,
            y: event.clientY - rect.top - rect.height / 2,
          },
        };
        setDragState(newDragState);
      }
    },
    []
  );

  const handleCornerDrag = useCallback(
    (event: PointerEvent) => {
      if (!dragState.isDragging || !detectedCorners) {
        return;
      }

      event.preventDefault();
      const containerRect = event.currentTarget.getBoundingClientRect();

      // Calculate new position relative to container
      const newX =
        ((event.clientX - containerRect.left - dragState.offset.x) /
          containerRect.width) *
        videoDimensions.width;
      const newY =
        ((event.clientY - containerRect.top - dragState.offset.y) /
          containerRect.height) *
        videoDimensions.height;

      // Clamp to image bounds
      const clampedX = Math.max(0, Math.min(videoDimensions.width, newX));
      const clampedY = Math.max(0, Math.min(videoDimensions.height, newY));

      // Update corners
      const updatedCorners = {
        ...detectedCorners,
        [dragState.isDragging]: { x: clampedX, y: clampedY },
      };

      onCornersChange(updatedCorners);
    },
    [dragState, detectedCorners, videoDimensions, onCornersChange]
  );

  const handleCornerDragEnd = useCallback(() => {
    setDragState({
      isDragging: null,
      offset: { x: 0, y: 0 },
    });
  }, []);

  return {
    dragState,
    handleCornerDragStart,
    handleCornerDrag,
    handleCornerDragEnd,
  };
}
