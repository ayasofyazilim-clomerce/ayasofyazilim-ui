import type { Column } from "@tanstack/react-table";
import type { MasterDataGridResources } from "../types";

export function getTranslations(
  key: string,
  t?: MasterDataGridResources,
  replacements?: Record<string, string>
): string {
  let text = t?.[key] ?? key;

  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(`{${placeholder}}`, value);
    });
  }

  return text;
}

export function getColumnName<TData>(
  column: Column<TData> | string,
  t?: MasterDataGridResources,
  fallback?: string
): string {
  if (typeof column === "string") {
    const translationKey = `column.${column}`;
    const translated = getTranslations(translationKey, t);
    if (translated !== translationKey) {
      return translated;
    }
    return fallback ?? column;
  }
  const translationKey = `column.${column.id}`;
  if (t?.[translationKey]) {
    return t[translationKey];
  }
  const header = column.columnDef.header;
  if (typeof header === "string") {
    return header;
  }
  return column.id;
}
