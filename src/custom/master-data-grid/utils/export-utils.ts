import type { Table } from "@tanstack/react-table";
import type {
  ColumnMeta,
  ExportColumnDef,
  MasterDataGridResources,
} from "../types";
import { getColumnName } from "./translation-utils";

export interface ExportOptions {
  filename?: string;
  /** Translations used for Excel and JSON headers. CSV keeps its legacy headers. */
  t?: MasterDataGridResources;
}

export interface BuildExportTableOptions {
  /**
   * "legacy": header string, else the column id (CSV's historical rule).
   * "translated": the `column.<id>` key in t, else the header string, else
   * the schema title, else the column id; a schema column's screen header
   * resolves the same way.
   */
  headers: "legacy" | "translated";
  t?: MasterDataGridResources;
}

export interface ExportTable {
  headers: string[];
  rows: unknown[][];
}

const EXCLUDED_COLUMNS = ["expander", "select", "actions", "edit-actions"];

export function buildExportTable<TData>(
  table: Table<TData>,
  options: BuildExportTableOptions
): ExportTable {
  const columns = table
    .getVisibleLeafColumns()
    .filter((col) => !EXCLUDED_COLUMNS.includes(col.id));

  const headers = columns.map((col) => {
    if (options.headers === "translated") {
      const meta = col.columnDef.meta as ColumnMeta | undefined;
      return getColumnName(col, options.t, meta?.schemaProperty?.title);
    }
    const header = col.columnDef.header;
    return typeof header === "string" ? header : col.id;
  });

  const rows = table.getFilteredRowModel().rows.map((row) =>
    columns.map((col) => {
      const columnDef = col.columnDef as ExportColumnDef<TData>;
      if (columnDef.accessorKey) {
        const keys = String(columnDef.accessorKey).split(".");
        return keys.reduce(
          (obj: unknown, key) =>
            obj && typeof obj === "object" && key in obj
              ? (obj as Record<string, unknown>)[key]
              : undefined,
          row.original
        );
      }
      if (columnDef.accessorFn) {
        return columnDef.accessorFn(row.original, row.index);
      }
      return row.getValue(col.id);
    })
  );

  return { headers, rows };
}

function download(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV<TData>(
  table: Table<TData>,
  options: ExportOptions = {}
): void {
  const { filename = "export" } = options;
  const { headers, rows } = buildExportTable(table, { headers: "legacy" });

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((value) => {
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
  download(blob, `${filename}.csv`);
}

export function exportToJSON<TData>(
  table: Table<TData>,
  options: ExportOptions = {}
): void {
  const { filename = "export", t } = options;
  const { headers, rows } = buildExportTable(table, {
    headers: "translated",
    t,
  });

  const objects = rows.map((row) =>
    Object.fromEntries(headers.map((header, i) => [header, row[i] ?? null]))
  );

  const blob = new Blob([JSON.stringify(objects, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  download(blob, `${filename}.json`);
}

// Required by write-excel-file for any Date cell (passed as a sheet option).
const EXCEL_DATE_FORMAT = "yyyy-mm-dd hh:mm";

const toExcelValue = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  ) {
    return value;
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export async function exportToExcel<TData>(
  table: Table<TData>,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = "export", t } = options;
  const { headers, rows } = buildExportTable(table, {
    headers: "translated",
    t,
  });

  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const sheet = [
    headers.map((header) => ({ value: header, fontWeight: "bold" as const })),
    ...rows.map((row) => row.map(toExcelValue)),
  ];

  await writeXlsxFile(sheet, { dateFormat: EXCEL_DATE_FORMAT }).toFile(
    `${filename}.xlsx`
  );
}
