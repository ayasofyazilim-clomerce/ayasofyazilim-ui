/*! tscanify v1.0.0 | Based on jscanify v1.4.0 | (c) ColonelParrot and other contributors | MIT License */

import { Canvas, createCanvas, Image, ImageData } from "canvas";
import { JSDOM } from "jsdom";
import cv, { Mat } from "opencv-ts";
import { CornerPoints, HighlightOptions, Point } from "./types";

// Custom type to handle the difference between Node's Canvas and HTMLCanvasElement
type CanvasResult = Canvas | HTMLCanvasElement;

/**
 * Installs DOM elements required for canvas operations
 */
function installDOM(): void {
  const dom = new JSDOM();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).document = dom.window.document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Image = Image;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).HTMLCanvasElement = Canvas;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).ImageData = ImageData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).HTMLImageElement = Image;
}

/**
 * Calculates distance between two points.
 * @param p1 point 1
 * @param p2 point 2
 * @returns distance between two points
 */
function distance(p1: Point, p2: Point): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export class TScanify {
  constructor() {
    installDOM();
  }

  /**
   * Loads OpenCV module
   * @param callback Function to call when OpenCV is initialized
   */
  loadOpenCV(callback: (opencv: typeof cv) => void): void {
    // opencv-ts uses onRuntimeInitialized
    cv.onRuntimeInitialized = () => {
      callback(cv);
    };
  }

  /**
   * Finds the contour of the paper within the image
   * @param img image to process (Mat)
   * @returns the biggest contour inside the image
   */
  findPaperContour(img: Mat) {
    const imgGray = new cv.Mat();
    cv.Canny(img, imgGray, 50, 200);

    const imgBlur = new cv.Mat();
    cv.GaussianBlur(imgGray, imgBlur, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);

    const imgThresh = new cv.Mat();
    cv.threshold(imgBlur, imgThresh, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    cv.findContours(imgThresh, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let maxContourIndex = -1;
    for (let i = 0; i < contours.size(); ++i) {
      const contourArea = cv.contourArea(contours.get(i));
      if (contourArea > maxArea) {
        maxArea = contourArea;
        maxContourIndex = i;
      }
    }

    const maxContour = maxContourIndex >= 0 ? contours.get(maxContourIndex) : null;

    imgGray.delete();
    imgBlur.delete();
    imgThresh.delete();
    contours.delete();
    hierarchy.delete();
    return maxContour;
  }

  /**
   * Highlights the paper detected inside the image.
   * @param image image to process
   * @param options options for highlighting. Accepts `color` and `thickness` parameter
   * @returns Canvas with original image and paper highlighted
   */
  highlightPaper(image: HTMLImageElement, options?: HighlightOptions): CanvasResult {
    options = options || {};
    options.color = options.color || "orange";
    options.thickness = options.thickness || 10;

    // Get image dimensions (assuming image has width and height properties)
    const width = image.width || 800;
    const height = image.height || 600;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const img = cv.imread(image);

    const maxContour = this.findPaperContour(img);
    // Convert the canvas to an HTML canvas id string for opencv-ts
    const canvasId = "outputCanvas";
    (canvas as unknown as HTMLCanvasElement).id = canvasId;

    // Use the canvas id instead of the canvas object
    cv.imshow(canvasId, img);
    if (maxContour) {
      const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = this.getCornerPoints(
        img,
      );

      ctx.strokeStyle = options.color!;
      ctx.lineWidth = options.thickness!;
      ctx.beginPath();
      ctx.moveTo(topLeftCorner.x, topLeftCorner.y);
      ctx.lineTo(topRightCorner.x, topRightCorner.y);
      ctx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
      ctx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
      ctx.closePath();
      ctx.stroke();
    }

    img.delete();
    return canvas;
  }

  /**
   * Gets the corner points of a contour
   * @param contour contour to find corners
   * @param originalImage original image (for size reference)
   * @returns object with corner points
   */
  getCornerPoints(originalImage: Mat): CornerPoints {


    // Implementation will depend on actual CV.js structure
    // This is a placeholder that would need to be updated
    return {
      topLeftCorner: { x: 0, y: 0 },
      topRightCorner: { x: originalImage.cols, y: 0 },
      bottomLeftCorner: { x: 0, y: originalImage.rows },
      bottomRightCorner: { x: originalImage.cols, y: originalImage.rows },
    };
  }

  /**
   * Performs perspective transform to get a top-down view of the detected document
   * @param image image containing document
   * @returns Canvas with the document in a top-down perspective
   */
  getPerspective(image: HTMLImageElement): CanvasResult {
    // Get image dimensions (assuming image has width and height properties)
    const width = image.width || 800;
    const height = image.height || 600;

    const canvas = createCanvas(width, height);
    const img = cv.imread(image);

    const maxContour = this.findPaperContour(img);
    if (maxContour) {
      const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = this.getCornerPoints(
        img,
      );

      // Calculate width and height for the transformed image
      const width = Math.max(distance(topLeftCorner, topRightCorner), distance(bottomLeftCorner, bottomRightCorner));
      const height = Math.max(distance(topLeftCorner, bottomLeftCorner), distance(topRightCorner, bottomRightCorner));

      // Create source points matrix for perspective transform
      const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
        topLeftCorner.x,
        topLeftCorner.y,
        topRightCorner.x,
        topRightCorner.y,
        bottomLeftCorner.x,
        bottomLeftCorner.y,
        bottomRightCorner.x,
        bottomRightCorner.y,
      ]);

      // Create destination points matrix for perspective transform
      const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, width, 0, 0, height, width, height]);

      // Perform perspective transform
      const M = cv.getPerspectiveTransform(srcPoints, dstPoints);

      // Clean up the temporary matrices when done
      srcPoints.delete();
      dstPoints.delete();
      const dst = new cv.Mat();

      cv.warpPerspective(img, dst, M, new cv.Size(width, height));
      // Use the canvas id instead of the canvas object
      const canvasId = "outputCanvas";
      (canvas as unknown as HTMLCanvasElement).id = canvasId;
      cv.imshow(canvasId, dst);

      dst.delete();
      M.delete();
    } else {
      // Use the canvas id instead of the canvas object
      const canvasId = "outputCanvas";
      (canvas as unknown as HTMLCanvasElement).id = canvasId;
      cv.imshow(canvasId, img);
    }

    img.delete();
    return canvas;
  }
}

export default TScanify;
