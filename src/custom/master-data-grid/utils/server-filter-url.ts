import type { ServerFilterConfig } from "../types";
import { urlKeysOf, type ServerFilterValue } from "./server-filter-utils";
import { scopedKey } from "./url-scope";

function isEmpty(value: ServerFilterValue | undefined): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    const range = value as { from?: string; to?: string };
    return !range.from && !range.to;
  }
  return false;
}

/**
 * Writes one filter's value into a copy of `params` and drops `skipCount`.
 * With a `prefix`, both are that grid's keys (`<prefix>.<key>`), and every
 * other key, another grid's included, is left as it was.
 */
export function applyFilterToParams(
  params: URLSearchParams,
  filter: ServerFilterConfig,
  value: ServerFilterValue | undefined,
  prefix?: string
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  urlKeysOf(filter, prefix).forEach((key) => next.delete(key));
  next.delete(scopedKey("skipCount", prefix));

  if (isEmpty(value)) return next;

  if (filter.type === "date-range") {
    const range = value as { from?: string; to?: string };
    if (range.from) next.set(scopedKey(filter.keyFrom, prefix), range.from);
    if (range.to) next.set(scopedKey(filter.keyTo, prefix), range.to);
    return next;
  }

  const key = scopedKey(filter.key, prefix);

  if (Array.isArray(value)) {
    value.forEach((entry) => next.append(key, String(entry)));
    return next;
  }

  next.set(key, String(value));
  return next;
}

/** Drops the filters' keys and `skipCount`, under `prefix` when one is given. */
export function clearFiltersFromParams(
  params: URLSearchParams,
  filters: ServerFilterConfig[],
  prefix?: string
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  filters.forEach((filter) => {
    urlKeysOf(filter, prefix).forEach((key) => next.delete(key));
  });
  next.delete(scopedKey("skipCount", prefix));
  return next;
}
