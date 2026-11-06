import type { ServerFilterConfig, ServerFilterValue } from "../types";
import { readFilterValues } from "./server-filter-utils";
import { scopedKey } from "./url-scope";

/** The page size a grid assumes when the URL names none and no pageSize is given. */
const DEFAULT_PAGE_SIZE = 10;

export interface GridUrlParams {
  skipCount: number;
  maxResultCount: number;
  /** Applied server filters, keyed by each filter's own (un-prefixed) key. */
  filters: Record<string, ServerFilterValue>;
}

type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function toSearchParams(input: SearchParamsInput): URLSearchParams {
  if (typeof (input as URLSearchParams).getAll === "function") {
    return input as URLSearchParams;
  }
  const params = new URLSearchParams();
  Object.entries(
    input as Record<string, string | string[] | undefined>
  ).forEach(([key, value]) => {
    if (value === undefined) return;
    (Array.isArray(value) ? value : [value]).forEach((entry) =>
      params.append(key, entry)
    );
  });
  return params;
}

function count(raw: string | null, minimum: number): number | undefined {
  if (raw === null || raw === "") return undefined;
  const value = Math.floor(Number(raw));
  return Number.isFinite(value) && value >= minimum ? value : undefined;
}

/**
 * Reads one grid's page and server filters from a URL, for the server page that
 * fetches its rows. Pass the grid's `urlState` prefix (none for a default grid)
 * and its `serverFilters`.
 * - Prefix grids: also pass the grid's `pageSize`. Such a grid leaves
 *   `<prefix>.maxResultCount` out of the URL while it equals that pageSize.
 * - Default grids: omit `pageSize`. They leave `maxResultCount` out of the URL
 *   only when it is 10, which is the fallback used here.
 * Keys belonging to other grids, or to no grid, are ignored. A `skipCount`
 * that falls inside a page is rounded down to that page's first row, which is
 * the page a prefix-mode grid shows for it.
 *
 * `searchParams` may be a `URLSearchParams` or a Next.js page's
 * `searchParams` record.
 */
export function getGridUrlParams(
  searchParams: SearchParamsInput,
  options: {
    prefix?: string;
    filters?: ServerFilterConfig[];
    pageSize?: number;
  } = {}
): GridUrlParams {
  const { prefix, filters = [], pageSize = DEFAULT_PAGE_SIZE } = options;
  const params = toSearchParams(searchParams);
  const maxResultCount =
    count(params.get(scopedKey("maxResultCount", prefix)), 1) ?? pageSize;
  const skipCount = count(params.get(scopedKey("skipCount", prefix)), 0) ?? 0;
  return {
    skipCount: Math.floor(skipCount / maxResultCount) * maxResultCount,
    maxResultCount,
    filters: readFilterValues(filters, params, prefix),
  };
}

/** The table pagination of a prefix-mode grid: the page its URL names. */
export function paginationFromUrl(
  searchParams: SearchParamsInput,
  prefix: string,
  pageSize: number
): { pageIndex: number; pageSize: number } {
  const { skipCount, maxResultCount } = getGridUrlParams(searchParams, {
    prefix,
    pageSize,
  });
  return {
    pageIndex: Math.floor(skipCount / maxResultCount),
    pageSize: maxResultCount,
  };
}
