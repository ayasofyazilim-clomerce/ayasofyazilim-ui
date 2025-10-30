// Types for tscanify

import cv from "opencv-ts";

export interface Point {
  x: number;
  y: number;
}

export interface HighlightOptions {
  color?: string;
  thickness?: number;
}

export interface CornerPoints {
  topLeftCorner: Point;
  topRightCorner: Point;
  bottomLeftCorner: Point;
  bottomRightCorner: Point;
}

export type WindowWithCV = Window & { cv: typeof cv };

