import type { SVGProps } from "react";

export * from "./android";
export * from "./app-store";
export * from "./apple";
export * from "./browser";
export * from "./json";
export * from "./linux";
export * from "./play-store";
export * from "./power-shell";
export * from "./swagger";
export * from "./ubuntu";
export * from "./windows";

export type IconType = SVGProps<SVGSVGElement> & {
  colorful?: "true" | "false";
};
