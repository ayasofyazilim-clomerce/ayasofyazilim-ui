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
 * fetches its rows. Pass the grid's `urlState` prefix (none for a default grid),
 * its `serverFilters`, and its `pageSize`: a grid in prefix mode leaves
 * `<prefix>.maxResultCount` out of the URL while it equals that pageSize.
 * Keys belonging to other grids, or to no grid, are ignored.
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
  return {
    skipCount: count(params.get(scopedKey("skipCount", prefix)), 0) ?? 0,
    maxResultCount:
      count(params.get(scopedKey("maxResultCount", prefix)), 1) ?? pageSize,
    filters: readFilterValues(filters, params, prefix),
  };
}

/** The table pagination a prefix-mode grid starts on: the page the URL names. */
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
