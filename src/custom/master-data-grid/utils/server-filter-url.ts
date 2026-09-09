import type { ServerFilterConfig } from "../types";
import { urlKeysOf, type ServerFilterValue } from "./server-filter-utils";

function isEmpty(value: ServerFilterValue | undefined): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    const range = value as { from?: string; to?: string };
    return !range.from && !range.to;
  }
  return false;
}

export function applyFilterToParams(
  params: URLSearchParams,
  filter: ServerFilterConfig,
  value: ServerFilterValue | undefined
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  urlKeysOf(filter).forEach((key) => next.delete(key));
  next.delete("skipCount");

  if (isEmpty(value)) return next;

  if (filter.type === "date-range") {
    const range = value as { from?: string; to?: string };
    if (range.from) next.set(filter.keyFrom, range.from);
    if (range.to) next.set(filter.keyTo, range.to);
    return next;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => next.append(filter.key, String(entry)));
    return next;
  }

  next.set(filter.key, String(value));
  return next;
}

export function clearFiltersFromParams(
  params: URLSearchParams,
  filters: ServerFilterConfig[]
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  filters.forEach((filter) => {
    urlKeysOf(filter).forEach((key) => next.delete(key));
  });
  next.delete("skipCount");
  return next;
}
