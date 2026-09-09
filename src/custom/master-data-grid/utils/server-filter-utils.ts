import type { Localization } from "../../date-tooltip";
import type { ServerFilterConfig } from "../types";

export type ServerFilterValue =
  | string
  | number
  | boolean
  | string[]
  | { from?: string; to?: string };

export function urlKeysOf(filter: ServerFilterConfig): string[] {
  return filter.type === "date-range"
    ? [filter.keyFrom, filter.keyTo]
    : [filter.key];
}

export function visibleFilters(
  filters: ServerFilterConfig[] | undefined
): ServerFilterConfig[] {
  return (filters ?? []).filter((filter) => filter.when !== false);
}

export function readFilterValue(
  filter: ServerFilterConfig,
  params: URLSearchParams
): ServerFilterValue | undefined {
  if (filter.type === "date-range") {
    const from = params.get(filter.keyFrom) ?? undefined;
    const to = params.get(filter.keyTo) ?? undefined;
    return from || to ? { from, to } : undefined;
  }

  if (filter.type === "array" || filter.type === "string-array") {
    const all = params.getAll(filter.key).filter(Boolean);
    return all.length ? all : undefined;
  }

  const raw = params.get(filter.key);
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
