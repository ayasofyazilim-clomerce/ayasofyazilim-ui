import { clsx, type ClassValue } from "clsx";
import { JSX } from "react";
import { twMerge } from "tailwind-merge";
import _ from "lodash";
export const lodash = _;
export * from "class-variance-authority";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: "accurate" | "normal";
  } = {},
) {
  const { decimals = 0, sizeType = "normal" } = opts;

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === "accurate" ? accurateSizes[i] ?? "Bytest" : sizes[i] ?? "Bytes"
  }`;
}

export function replacePlaceholders(
  string: string,
  replacements: { holder: string; replacement: string | React.ReactNode }[],
): (string | React.ReactNode | JSX.Element)[] {
  if (!string || !replacements || replacements.length === 0) {
    return [];
  }

  let result: (string | React.ReactNode | JSX.Element)[] = [string];

  replacements.forEach(({ holder, replacement }) => {
    const updatedResult: (string | React.ReactNode)[] = [];

    result.forEach((element) => {
      if (typeof element === "string") {
        const parts: string[] = (element as string).split(holder);
        parts.forEach((part, i) => {
          if (i !== parts.length - 1) {
            updatedResult.push(part, replacement);
          } else {
            updatedResult.push(part);
          }
        });
      } else {
        updatedResult.push(element);
      }
    });

    result = updatedResult;
  });

  return result;
}
