"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ayasofyazilim-ui/components/table";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import * as React from "react";
import { ChartData, EmptyConfig } from ".";
import { CardClassNames, ChartCard } from "./chart-card";

type TableRowData = ChartData[number];
type TableCellValue = TableRowData[string] | undefined;

export type TableChartColumn = {
  /** Data key to read from each row. */
  key: string;
  /** Column header label. */
  label: React.ReactNode;
  align?: "left" | "right" | "center";
  /** Render the cell as a row header (`<th scope="row">`) instead of a data cell. */
  isRowHeader?: boolean;
  /** Custom cell renderer; receives the raw value and the full row. */
  formatter?: (value: TableCellValue, row: TableRowData) => React.ReactNode;
};

export type TableChartProps = {
  data: ChartData;
  columns: TableChartColumn[];
  title?: React.ReactNode;
  description?: React.ReactNode;
  period?: React.ReactNode;
  footer?: React.ReactNode;
  caption?: React.ReactNode;
  /** Limit the number of rendered rows (e.g. top-N). */
  maxRows?: number;
  classNames?: {
    chart?: {
      container?: string;
      table?: string;
    };
    card?: CardClassNames;
  };
} & EmptyConfig;

const alignClassName: Record<NonNullable<TableChartColumn["align"]>, string> = {
  left: "text-left",
  right: "text-right tabular-nums",
  center: "text-center",
};

function renderCellContent(
  column: TableChartColumn,
  row: TableRowData
): React.ReactNode {
  const value = row[column.key];
  if (column.formatter) {
    return column.formatter(value, row);
  }
  return value === undefined || value === null || value === "" ? "-" : value;
}

/**
 * Tabular "chart" for comparison data that does not fit a plotted axis —
 * e.g. cumulative period comparisons (This Week / Month / Year / All Time)
 * where wildly different magnitudes make a shared axis misleading.
 * Rendered inside the shared {@link ChartCard} so it matches the other charts.
 */
export function TableChart({
  data,
  columns,
  title,
  description,
  period,
  footer,
  caption,
  maxRows,
  classNames,
  emptyState,
}: TableChartProps) {
  const rows = typeof maxRows === "number" ? data.slice(0, maxRows) : data;
  const keyColumn = columns[0]?.key;

  return (
    <ChartCard
      title={title}
      description={description}
      period={period}
      footer={footer}
      classNames={classNames?.card}
      emptyState={data.length === 0 ? emptyState : undefined}
    >
      <div
        className={cn("w-full overflow-x-auto", classNames?.chart?.container)}
      >
        <Table className={cn(classNames?.chart?.table)}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(alignClassName[column.align ?? "left"])}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow
                key={String(
                  (keyColumn ? row[keyColumn] : undefined) ?? rowIndex
                )}
              >
                {columns.map((column) =>
                  column.isRowHeader ? (
                    <TableHead
                      key={column.key}
                      scope="row"
                      className={cn(
                        "text-foreground font-medium",
                        alignClassName[column.align ?? "left"]
                      )}
                    >
                      {renderCellContent(column, row)}
                    </TableHead>
                  ) : (
                    <TableCell
                      key={column.key}
                      className={cn(alignClassName[column.align ?? "left"])}
                    >
                      {renderCellContent(column, row)}
                    </TableCell>
                  )
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {caption ? (
          <p className="text-muted-foreground mt-2 text-xs">{caption}</p>
        ) : null}
      </div>
    </ChartCard>
  );
}
