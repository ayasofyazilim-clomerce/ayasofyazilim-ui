import type { Table } from "@tanstack/react-table";
import type { ExportColumnDef } from "../types";

export interface ExportOptions {
  filename?: string;
}

export function exportToCSV<TData>(
  table: Table<TData>,
  options: ExportOptions = {}
): void {
  const { filename = "export" } = options;

  const rows = table.getFilteredRowModel().rows;

  const excludedColumns = ["expander", "select", "actions", "edit-actions"];
  const columns = table
    .getVisibleLeafColumns()
    .filter((col) => !excludedColumns.includes(col.id));

  const headers = columns.map((col) => {
    const header = col.columnDef.header;
    return typeof header === "string" ? header : col.id;
  });

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      columns
        .map((col) => {
          const columnDef = col.columnDef as ExportColumnDef<TData>;
          let value: unknown;

          if (columnDef.accessorKey) {
            const keys = String(columnDef.accessorKey).split(".");
            value = keys.reduce(
              (obj: unknown, key) =>
                obj && typeof obj === "object" && key in obj
                  ? (obj as Record<string, unknown>)[key]
                  : undefined,
              row.original
            );
          } else if (columnDef.accessorFn) {
            value = columnDef.accessorFn(row.original, row.index);
          } else {
            value = row.getValue(col.id);
          }
          const strValue = String(value ?? "");
          return strValue.includes(",") || strValue.includes('"')
            ? `"${strValue.replace(/"/g, '""')}"`
            : strValue;
        })
        .join(",")
    ),
  ].join("\n");

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
