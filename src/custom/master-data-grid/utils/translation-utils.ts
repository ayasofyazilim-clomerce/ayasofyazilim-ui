import type { Column } from "@tanstack/react-table";
import type { FilterOperator, MasterDataGridResources } from "../types";

/**
 * Centralized translation utilities for master-data-grid
 * All translation logic and fallback patterns are consolidated here
 */

/**
 * Get translated text with key as fallback and optional template replacement
 *
 * @param key - Translation key (e.g., 'toolbar.search', 'validation.min_length')
 * @param t - Translation object
 * @param replacements - Optional object for template replacement (e.g., { min: '5' })
 * @returns Translated text or key as fallback
 *
 * @example
 * getTranslations('toolbar.search', t) // Returns translation or 'toolbar.search'
 * getTranslations('validation.min_length', t, { min: '5' }) // Returns "Minimum 5 characters"
 */
export function getTranslations(
  key: string,
  t?: MasterDataGridResources,
  replacements?: Record<string, string>
): string {
  // Get translation or use key as fallback
  let text = t?.[key] ?? key;

  // Apply template replacements if provided
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(`{${placeholder}}`, value);
    });
  }

  return text;
}

/**
 * Get column name with translation support
 * Handles both existing columns and schema-generated columns
 *
 * @param column - Column object OR field name string
 * @param t - Translation object
 * @param fallback - Optional fallback (title for schema, not used for Column objects)
 * @returns Translated column name or fallback
 */
export function getColumnName<TData>(
  column: Column<TData> | string,
  t?: MasterDataGridResources,
  fallback?: string
): string {
  // Handle string input (schema field name)
  if (typeof column === "string") {
    const translationKey = `column.${column}`;
    const translated = getTranslations(translationKey, t);

    // If translation exists (not just the key fallback), use it
    if (translated !== translationKey) {
      return translated;
    }

    // Fall back to provided fallback, then formatted field name
    return fallback ?? formatFieldName(column);
  }

  // Handle Column object
  const translationKey = `column.${column.id}`;

  // Try translation first
  if (t?.[translationKey]) {
    return t[translationKey];
  }

  // Fall back to column header if it's a string
  const header = column.columnDef.header;
  if (typeof header === "string") {
    return header;
  }

  // Fall back to column id
  return column.id;
}

/**
 * Format field name to human-readable label
 * Converts camelCase or snake_case to Title Case
 */
function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
}
