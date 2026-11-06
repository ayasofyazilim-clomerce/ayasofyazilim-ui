import type { Localization } from "../../date-tooltip";
import type { ServerFilterConfig, ServerFilterValue } from "../types";
import { scopedKey } from "./url-scope";

export type { ServerFilterValue };

/** The URL keys a filter writes, under `prefix` when one is given. */
export function urlKeysOf(
  filter: ServerFilterConfig,
  prefix?: string
): string[] {
  const keys =
    filter.type === "date-range"
      ? [filter.keyFrom, filter.keyTo]
      : [filter.key];
  return keys.map((key) => scopedKey(key, prefix));
}

export function visibleFilters(
  filters: ServerFilterConfig[] | undefined
): ServerFilterConfig[] {
  return (filters ?? []).filter((filter) => filter.when !== false);
}

/** A filter's value from its URL keys (under `prefix` when one is given). */
export function readFilterValue(
  filter: ServerFilterConfig,
  params: URLSearchParams,
  prefix?: string
): ServerFilterValue | undefined {
  if (filter.type === "date-range") {
    const from = params.get(scopedKey(filter.keyFrom, prefix)) ?? undefined;
    const to = params.get(scopedKey(filter.keyTo, prefix)) ?? undefined;
    return from || to ? { from, to } : undefined;
  }

  const key = scopedKey(filter.key, prefix);

  if (filter.type === "array" || filter.type === "string-array") {
    const all = params.getAll(key).filter(Boolean);
    return all.length ? all : undefined;
  }

  const raw = params.get(key);
  if (raw === null || raw === "") return undefined;

  if (filter.type === "boolean") {
    if (raw === "true") return true;
    if (raw === "false") return false;
    return undefined;
  }

  if (filter.type === "number") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return raw;
}

/** Every applied filter's value, keyed by the filter's own (un-prefixed) key. */
export function readFilterValues(
  filters: ServerFilterConfig[],
  params: URLSearchParams,
  prefix?: string
): Record<string, ServerFilterValue> {
  const values: Record<string, ServerFilterValue> = {};
  filters.forEach((filter) => {
    const value = readFilterValue(filter, params, prefix);
    if (value !== undefined) values[filter.key] = value;
  });
  return values;
}

function formatDate(value: string, localization?: Localization): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(localization?.locale, {
    timeZone: localization?.timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function labelOf(
  options: ReadonlyArray<{ label: string; value: string }>,
  value: string
): string {
  const hit = options.find((option) => option.value === value);
  return hit ? hit.label : value;
}

export function formatFilterValue(
  filter: ServerFilterConfig,
  value: ServerFilterValue,
  localization?: Localization
): string {
  if (filter.type === "date-range") {
    const range = value as { from?: string; to?: string };
    const from = range.from ? formatDate(range.from, localization) : "";
    const to = range.to ? formatDate(range.to, localization) : "";
    return `${from} – ${to}`;
  }

  if (filter.type === "date") {
    return formatDate(String(value), localization);
  }

  if (filter.type === "boolean") {
    const hit = filter.options.find((option) => option.value === value);
    return hit ? hit.label : String(value);
  }

  if (filter.type === "select") {
    return labelOf(filter.options, String(value));
  }

  if (filter.type === "array") {
    const values = value as string[];
    const shown = values.slice(0, 2).map((v) => labelOf(filter.options, v));
    const rest = values.length - shown.length;
    return rest > 0 ? `${shown.join(", ")} +${rest}` : shown.join(", ");
  }

  if (filter.type === "string-array") {
    return (value as string[]).join(", ");
  }

  return String(value);
}
