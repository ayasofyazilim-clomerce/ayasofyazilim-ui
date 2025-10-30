/*! tscanify-browser v1.0.0 | Based on jscanify v1.4.0 | (c) ColonelParrot and other contributors | MIT License */

import cv, { Mat } from 'opencv-ts';
import { CornerPoints, HighlightOptions, Point, WindowWithCV } from './types';

/**
 * Calculates distance between two points.
 * @param p1 point 1
 * @param p2 point 2
 * @returns distance between two points
 */
function distance(p1: Point, p2: Point): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export class TScanifyBrowser {
  constructor() { }

  /**
   * Loads OpenCV module
   * @param callback Function to call when OpenCV is initialized
   */
  loadOpenCV(callback: (opencv: typeof cv) => void): void {
    // First check if global cv is available (browser-loaded version)
    if ((window as unknown as WindowWithCV).cv && (window as unknown as WindowWithCV).cv.Mat) {
      callback((window as unknown as WindowWithCV).cv);
      return;
    }

    // Next, check if the imported cv is available
    if (cv && (cv as typeof cv).Mat) {
      callback(cv);
      return;
    }

    // Wait for opencv to be ready (check both global and imported)
    const checkInterval = setInterval(() => {
      // First priority: global cv
      if ((window as unknown as WindowWithCV).cv && (window as unknown as WindowWithCV).cv.Mat) {
        clearInterval(checkInterval);
        callback((window as unknown as WindowWithCV).cv);
        return;
      }

      // Second priority: imported cv
      if (cv && (cv as typeof cv).Mat) {
        clearInterval(checkInterval);
        callback(cv);
        return;
      }
    }, 200);

    // Set timeout to avoid infinite waiting
    setTimeout(() => {
      clearInterval(checkInterval);
      // Try to load it dynamically as a last resort
      this.loadOpenCVDynamically()
        .then((loadedCv) => {
          callback(loadedCv);
        })
    }, 8000); // 8 seconds timeout
  }

  /**
   * Dynamically loads OpenCV.js as a last resort
   * @returns Promise that resolves with the OpenCV object
   */
  private loadOpenCVDynamically(): Promise<typeof cv> {
    return new Promise((resolve, reject) => {
      if ((window as unknown as WindowWithCV).cv && (window as unknown as WindowWithCV).cv.Mat) {
        resolve((window as unknown as WindowWithCV).cv);
        return;
      }

      // Try to load OpenCV.js dynamically
      const script = document.createElement('script');
      script.setAttribute('async', 'true');
      script.setAttribute('type', 'text/javascript');
      script.setAttribute('src', 'https://docs.opencv.org/4.5.5/opencv.js');

      script.onload = () => {
        // Check if OpenCV is available
        const checkInterval = setInterval(() => {
          if ((window as unknown as WindowWithCV).cv && (window as unknown as WindowWithCV).cv.Mat) {
            clearInterval(checkInterval);
            resolve((window as unknown as WindowWithCV).cv);
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('OpenCV dynamic load timed out'));
        }, 5000);
      };

      script.onerror = () => {
        reject(new Error('Failed to load OpenCV.js dynamically'));
      };

      document.body.appendChild(script);
    });
  }

  /**
   * Creates a new canvas of the given width and height
   * @param width Canvas width
   * @param height Canvas height
   * @returns Canvas object
   */
  createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * Gets a Mat from an image or canvas
   * @param image Image or Canvas element
   * @returns OpenCV Mat
   */
  imageToMat(image: HTMLImageElement | HTMLCanvasElement): Mat {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Set canvas dimensions to match input
    canvas.width = image.width as number;
    canvas.height = image.height as number;

    // Draw the image to the canvas
    ctx.drawImage(image, 0, 0, image.width as number, image.height as number);

    // Get the image data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Convert to Mat
    return cv.matFromImageData(imageData);
  }

  /**
   * Resizes an image to fit within the given maximum width and height
   * @param image Image to resize
   * @param maxWidth Maximum width
   * @param maxHeight Maximum height
   * @returns Resized image as Canvas
   */
  resizeImage(
    image: HTMLImageElement | HTMLCanvasElement,
    maxWidth = 500,
    maxHeight = 500
  ): HTMLCanvasElement {
    const canvas = this.createCanvas(1, 1);
    const ctx = canvas.getContext('2d')!;

    const originalWidth = image.width as number;
    const originalHeight = image.height as number;

    // Calculate new dimensions
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = (originalHeight * maxWidth) / originalWidth;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = (newWidth * maxHeight) / newHeight;
    }

    // Set canvas to new dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Draw the image at the new size
    ctx.drawImage(image, 0, 0, newWidth, newHeight);
    return canvas;
  }

  /**
   * Finds the corners of a document in an image
   * @param src Input image as Mat
   * @returns Four corner points of the document
   */
  findDocumentCorners(src: Mat): CornerPoints | null {
    try {
      // Convert to grayscale
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Apply Gaussian blur
      const blur = new cv.Mat();
      const ksize = new cv.Size(5, 5);
      cv.GaussianBlur(gray, blur, ksize, 0, 0, cv.BORDER_DEFAULT);

      // Apply Canny edge detection
      const edges = new cv.Mat();
      cv.Canny(blur, edges, 75, 200);

      // Find contours
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(
        edges,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );

      // Find largest contour
      let maxArea = 0;
      let largestContourIndex = -1;

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        if (area > maxArea) {
          maxArea = area;
          largestContourIndex = i;
        }

        contour.delete();
      }

      // If no contour found, return null
      if (largestContourIndex === -1) {
        // Clean up
        gray.delete();
        blur.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
        return null;
      }

      // Get largest contour
      const largestContour = contours.get(largestContourIndex);

      // Approximate the contour with a polygon
      const epsilon = 0.02 * cv.arcLength(largestContour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(largestContour, approx, epsilon, true);

      // If the approximation has 4 points, we assume it's a quadrilateral
      let corners: CornerPoints | null = null;

      if (approx.rows === 4) {
        const points: Point[] = [];

        for (let i = 0; i < 4; i++) {
          points.push({
            x: approx.data32S[i * 2] as number,
            y: approx.data32S[i * 2 + 1] as number,
          });
        }

        // Order the points: top-left, top-right, bottom-right, bottom-left
        points.sort((a, b) => a.y - b.y);

        // Top points (sorted by y)
        const topPoints = points.slice(0, 2).sort((a, b) => a.x - b.x);
        const topLeftCorner = topPoints[0]!;
        const topRightCorner = topPoints[1]!;

        // Bottom points (sorted by y)
        const bottomPoints = points.slice(2).sort((a, b) => a.x - b.x);
        const bottomLeftCorner = bottomPoints[0]!;
        const bottomRightCorner = bottomPoints[1]!;

        corners = {
          topLeftCorner,
          topRightCorner,
          bottomRightCorner,
          bottomLeftCorner,
        };
      }

      // Clean up
      gray.delete();
      blur.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();
      approx.delete();
      largestContour.delete();

      return corners;
    } catch {
      return null;
    }
  }

  /**
   * Performs perspective transform on an image based on corner points
   * @param src Source image as Mat
   * @param corners Corner points of document
   * @param width Output width
   * @param height Output height
   * @returns Transformed Mat
   */
  warpPerspective(
    src: Mat,
    corners: CornerPoints,
    width: number,
    height: number
  ): Mat {
    // Create matrices for source and destination points
    const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      corners.topLeftCorner.x,
      corners.topLeftCorner.y,
      corners.topRightCorner.x,
      corners.topRightCorner.y,
      corners.bottomRightCorner.x,
      corners.bottomRightCorner.y,
      corners.bottomLeftCorner.x,
      corners.bottomLeftCorner.y,
    ]);

    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0,
      0,
      width,
      0,
      width,
      height,
      0,
      height,
    ]);

    // Get perspective transform matrix
    const M = cv.getPerspectiveTransform(srcPoints, dstPoints);

    // Apply perspective transform
    const dst = new cv.Mat();
    cv.warpPerspective(
      src,
      dst,
      M,
      new cv.Size(width, height),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar()
    );

    // Clean up
    srcPoints.delete();
    dstPoints.delete();
    M.delete();

    return dst;

  }

  /**
   * Highlights corners of a detected document in an image
   * @param image Source image
   * @param corners Corner points to highlight
   * @param options Highlight options
   * @returns Canvas with highlighted corners
   */
  highlightCorners(
    image: HTMLImageElement | HTMLCanvasElement,
    corners: CornerPoints,
    options: HighlightOptions = {}
  ): HTMLCanvasElement {
    // Use our own default options since the HighlightOptions interface only has color and thickness
    const thickness = options.thickness || 2;
    const color = options.color || '#3cba54';
    const pointRadius = 3;
    const pointColor = '#db3236';

    const canvas = this.createCanvas(
      image.width as number,
      image.height as number
    );
    const ctx = canvas.getContext('2d')!;

    // Draw the original image
    ctx.drawImage(image, 0, 0);

    // Draw lines connecting the corners
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(corners.topLeftCorner.x, corners.topLeftCorner.y);
    ctx.lineTo(corners.topRightCorner.x, corners.topRightCorner.y);
    ctx.lineTo(corners.bottomRightCorner.x, corners.bottomRightCorner.y);
    ctx.lineTo(corners.bottomLeftCorner.x, corners.bottomLeftCorner.y);
    ctx.lineTo(corners.topLeftCorner.x, corners.topLeftCorner.y);
    ctx.stroke();

    // Draw dots at the corners
    const cornerPoints = [
      corners.topLeftCorner,
      corners.topRightCorner,
      corners.bottomRightCorner,
      corners.bottomLeftCorner,
    ];

    ctx.fillStyle = pointColor;
    cornerPoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    return canvas;
  }

  /**
   * Processes an image to detect and extract a document
   * @param image Input image
   * @returns Object containing original, highlighted and processed images as canvases
   */
  async processImage(image: HTMLImageElement): Promise<{
    original: HTMLCanvasElement;
    highlighted: HTMLCanvasElement | null;
    processed: HTMLCanvasElement | null;
  }> {
    // Resize the image for processing
    const resized = this.resizeImage(image);

    // Convert to Mat
    const src = this.imageToMat(resized);

    // Find document corners
    const corners = this.findDocumentCorners(src);

    if (!corners) {
      // No document found
      src.delete();
      return {
        original: resized,
        highlighted: null,
        processed: null,
      };
    }

    // Highlight corners
    const highlighted = this.highlightCorners(resized, corners);

    // Calculate output dimensions
    const width = Math.max(
      distance(corners.topRightCorner, corners.topLeftCorner),
      distance(corners.bottomRightCorner, corners.bottomLeftCorner)
    );

    const height = Math.max(
      distance(corners.topLeftCorner, corners.bottomLeftCorner),
      distance(corners.topRightCorner, corners.bottomRightCorner)
    );

    // Apply perspective transform
    const warped = this.warpPerspective(src, corners, width, height);

    // Convert Mat to Canvas
    const processed = this.createCanvas(width, height);
    const ctx = processed.getContext('2d')!;

    const imgData = new ImageData(
      new Uint8ClampedArray(warped.data),
      warped.cols,
      warped.rows
    );

    ctx.putImageData(imgData, 0, 0);

    // Clean up
    src.delete();
    warped.delete();

    return {
      original: resized,
      highlighted,
      processed,
    };
  }

  /**
   * Converts a canvas to a data URL
   * @param canvas Canvas to convert
   * @param type Image type (default: 'image/png')
   * @param quality Image quality for JPEG (0-1)
   * @returns Data URL string
   */
  canvasToDataURL(
    canvas: HTMLCanvasElement,
    type = 'image/png',
    quality = 0.9
  ): string {
    return canvas.toDataURL(type, quality);
  }

  /**
   * Creates an image element from a data URL
   * @param dataURL Data URL string
   * @returns Promise resolving to an Image element
   */
  dataURLToImage(dataURL: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error('Failed to load image from data URL'));
      img.src = dataURL;
    });
  }
}
