import type { GridUrlState } from "../types";

/** The URL key for `key`: `<prefix>.<key>`, or `key` itself with no prefix. */
export function scopedKey(key: string, prefix?: string): string {
  return prefix ? `${prefix}.${key}` : key;
}

/** True when the grid keeps its state under prefixed URL keys. */
export function isPrefixUrlState(
  urlState: GridUrlState | undefined
): urlState is { prefix: string } {
  return typeof urlState === "object" && urlState !== null;
}

/** The URL key prefix in prefix mode; undefined in default and "none" mode. */
export function urlPrefixOf(
  urlState: GridUrlState | undefined
): string | undefined {
  return isPrefixUrlState(urlState) ? urlState.prefix : undefined;
}
