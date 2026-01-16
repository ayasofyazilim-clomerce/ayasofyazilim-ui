import type { Table } from "@tanstack/react-table";
import type { ExportColumnDef } from "../types";

export interface ExportOptions {
  filename?: string;
}

/**
 * Export table data to CSV with advanced value extraction
 * Handles nested properties, custom accessors, and proper CSV formatting
 */
export function exportToCSV<TData>(
  table: Table<TData>,
  options: ExportOptions = {}
): void {
  const { filename = "export" } = options;

  const rows = table.getFilteredRowModel().rows;

  // Filter out non-data columns (expander, select, actions, edit-actions)
  const excludedColumns = ["expander", "select", "actions", "edit-actions"];
  const columns = table
    .getVisibleLeafColumns()
    .filter((col) => !excludedColumns.includes(col.id));

  // Use column headers for CSV header row
  const headers = columns.map((col) => {
    const header = col.columnDef.header;
    return typeof header === "string" ? header : col.id;
  });

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      columns
        .map((col) => {
          // Get value from original data using accessorKey or accessorFn
          const columnDef = col.columnDef as ExportColumnDef<TData>;
          let value: unknown;

          if (columnDef.accessorKey) {
            // Direct property access with nested support
            const keys = String(columnDef.accessorKey).split(".");
            value = keys.reduce(
              (obj: unknown, key) =>
                obj && typeof obj === "object" && key in obj
                  ? (obj as Record<string, unknown>)[key]
                  : undefined,
              row.original
            );
          } else if (columnDef.accessorFn) {
            // Custom accessor function
            value = columnDef.accessorFn(row.original, row.index);
          } else {
            // Fallback to getValue
            value = row.getValue(col.id);
          }

          // Format the value for CSV
          const strValue = String(value ?? "");
          return strValue.includes(",") || strValue.includes('"')
            ? `"${strValue.replace(/"/g, '""')}"`
            : strValue;
        })
        .join(",")
    ),
  ].join("\n");

  // Add UTF-8 BOM to ensure proper encoding of special characters
  const csvWithBOM = "\uFEFF" + csv;
  const blob = new Blob([csvWithBOM], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
