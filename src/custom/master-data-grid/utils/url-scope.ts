import type { GridUrlState } from "../types";

/** True for a prefix that holds more than whitespace. */
function isUsablePrefix(prefix: unknown): prefix is string {
  return typeof prefix === "string" && prefix.trim() !== "";
}

/**
 * The URL key for `key`: `<prefix>.<key>`, or `key` itself with no prefix.
 * An empty or whitespace prefix counts as none.
 */
export function scopedKey(key: string, prefix?: string): string {
  return isUsablePrefix(prefix) ? `${prefix}.${key}` : key;
}

/**
 * True when the grid keeps its state under prefixed URL keys. A `{ prefix }`
 * whose prefix is empty or whitespace is not prefix mode: the grid runs in
 * default mode (see isBlankPrefixUrlState).
 */
export function isPrefixUrlState(
  urlState: GridUrlState | undefined
): urlState is { prefix: string } {
  return (
    typeof urlState === "object" &&
    urlState !== null &&
    isUsablePrefix(urlState.prefix)
  );
}

/** True for `{ prefix }` with an empty or whitespace prefix (default mode). */
export function isBlankPrefixUrlState(
  urlState: GridUrlState | undefined
): boolean {
  return (
    typeof urlState === "object" &&
    urlState !== null &&
    !isUsablePrefix(urlState.prefix)
  );
}

/** The URL key prefix in prefix mode; undefined in default and "none" mode. */
export function urlPrefixOf(
  urlState: GridUrlState | undefined
): string | undefined {
  return isPrefixUrlState(urlState) ? urlState.prefix : undefined;
}
