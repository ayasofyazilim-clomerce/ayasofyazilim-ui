"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

type Props = {
  imageUrl: string;
  zoom?: number;
  classNames?: {
    container?: string;
    canvas?: string;
  };
  minZoom?: number;
  maxZoom?: number;
  onZoomChange?: (zoom: number) => void;
};

export default function ImageCanvas({
  imageUrl,
  zoom = 1,
  classNames,
  onZoomChange,
  minZoom = 0.1,
  maxZoom = 5,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);

  const renderError = useCallback((errorMessage: string) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set styling for the error message
    ctx.fillStyle = "rgba(220, 53, 69, 0.1)"; // Light red background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#dc3545"; // Bootstrap danger color
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Split message by newlines and render each line
    const lines = errorMessage.split("\n");
    const lineHeight = 20;
    const startY = canvas.height / 2 - (lines.length * lineHeight) / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
  }, []);

  // Memoized rendering function
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    if (!image) {
      if (error) {
        renderError(error);
      }
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match container
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate the center of the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Calculate the scaled dimensions
    const scaledWidth = image.width * currentZoom;
    const scaledHeight = image.height * currentZoom;

    // Calculate position to center the image
    const x = centerX - scaledWidth / 2 + position.x;
    const y = centerY - scaledHeight / 2 + position.y;

    // Draw the image with the current zoom and position
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
  }, [image, currentZoom, position]); // Load the image - optimized to properly clean up
  useEffect(() => {
    const img = new Image();

    const onLoad = () => {
      setImage(img);
      // We need to wait for the next render cycle after setImage before rendering the canvas
      // This ensures the image state is updated before trying to render
      setTimeout(() => renderCanvas(), 0);
    };

    const onError = (e: ErrorEvent) => {
      const errorMsg = e.message || "Failed to load image";
      setError(`Failed to load image: ${errorMsg}`);
      setImage(null);
      setTimeout(() => renderCanvas(), 0);
    };

    img.addEventListener("load", onLoad);
    img.addEventListener("error", onError);

    try {
      img.src = imageUrl;
      img.crossOrigin = "anonymous"; // Handle CORS if needed
      img.className = "border rounded-md";
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Invalid image URL";
      setError(`Image error: ${errorMsg}`);
    }
    return () => {
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
      img.src = ""; // Clean up to avoid memory leaks
    };
  }, [imageUrl]);

  // Ensure the canvas is drawn whenever image, zoom, or position changes
  useEffect(() => {
    if (image) {
      renderCanvas();
    }
  }, [image, currentZoom, position, renderCanvas]);

  // Handle window resize with requestAnimationFrame for better performance
  useEffect(() => {
    let frameId: number;
    let isResizing = false;

    const handleResize = () => {
      if (!isResizing) {
        isResizing = true;

        frameId = requestAnimationFrame(() => {
          renderCanvas();
          isResizing = false;
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
    };
  }, [renderCanvas]);

  // Handle zoom changes from props
  useEffect(() => {
    if (zoom !== undefined) {
      // Set the zoom level
      if (zoom >= minZoom && zoom <= maxZoom && zoom !== currentZoom) {
        setCurrentZoom(zoom);
        if (onZoomChange) {
          onZoomChange(zoom);
        }
      }
    }
  }, [zoom, minZoom, maxZoom, currentZoom, onZoomChange]);

  // Mouse event handlers for dragging - memoized with useCallback
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging) return;

      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      // Calculate new zoom level
      const zoomFactor = 0.1;
      let newZoom = currentZoom;

      if (e.deltaY < 0) {
        // Zoom in
        newZoom = Math.min(currentZoom + zoomFactor, maxZoom);
      } else {
        // Zoom out
        newZoom = Math.max(currentZoom - zoomFactor, minZoom);
      }

      if (newZoom !== currentZoom) {
        setCurrentZoom(newZoom);
        if (onZoomChange) {
          onZoomChange(newZoom);
        }
      }
    },
    [currentZoom, minZoom, maxZoom, onZoomChange]
  ); // Add non-passive wheel event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  return (
    <div className={cn(`relative w-full h-full`, classNames?.container)}>
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full h-full cursor-grab",
          isDragging ? "cursor-grabbing" : "",
          classNames?.canvas
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        // onWheel handler removed and replaced with addEventListener above
      />
    </div>
  );
}
