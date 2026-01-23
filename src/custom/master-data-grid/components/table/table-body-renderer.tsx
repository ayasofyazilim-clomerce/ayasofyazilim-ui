"use no memo";
import type { Row, Table as TanStackTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import React from "react";
import { TableBody, TableCell, TableRow } from "../../../../components/table";
import { cn } from "../../../../lib/utils";
import {
  getPinningCellClassNames,
  getPinningCellStyles,
} from "../../utils/pinning-utils";

interface TableBodyRendererProps<TData> {
  table: TanStackTable<TData>;
  rows: Row<TData>[];
  rowClassName?: string | ((row: TData) => string);
  cellClassName?: string | ((cell: { row: TData; columnId: string }) => string);
  editingRows?: Record<string, Record<string, unknown>>;
  getRowId?: (row: TData, index: number) => string;
  editingEnabled?: boolean;
  emptyMessage?: string;
  expansionEnabled?: boolean;
  expansionRenderContent?: (row: TData) => React.ReactNode;
  expansionComponent?: React.ComponentType<{ row: TData }>;
  bodyClassName?: string;
}

export function TableBodyRenderer<TData>({
  table,
  rows,
  rowClassName,
  cellClassName,
  editingRows,
  getRowId,
  editingEnabled,
  emptyMessage,
  expansionEnabled,
  expansionRenderContent,
  expansionComponent,
  bodyClassName,
}: TableBodyRendererProps<TData>) {
  return (
    <TableBody className={bodyClassName}>
      {rows.length ? (
        rows.map((row) => (
          <React.Fragment key={row.id}>
            <TableRow
              data-state={row.getIsSelected() && "selected"}
              className={cn(
                typeof rowClassName === "function"
                  ? rowClassName(row.original)
                  : rowClassName,
                "group"
              )}
            >
              {row.getVisibleCells().map((cell) => {
                const cellClass =
                  typeof cellClassName === "function"
                    ? cellClassName({
                        row: row.original,
                        columnId: cell.column.id,
                      })
                    : cellClassName;

                const rowId = getRowId
                  ? getRowId(row.original, row.index)
                  : String(row.index);
                const isEditing = editingRows?.[rowId] !== undefined;

                return (
                  <TableCell
                    key={cell.id}
                    style={getPinningCellStyles(cell)}
                    className={cn(
                      cellClass,
                      "last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0",
                      getPinningCellClassNames(cell),
                      isEditing && "py-0",
                      editingEnabled && "border",
                      editingEnabled &&
                        !isEditing &&
                        "hover:border-muted-foreground/40"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
            {row.getIsExpanded() && expansionEnabled && (
              <TableRow>
                <TableCell colSpan={row.getVisibleCells().length}>
                  {expansionRenderContent?.(row.original)}
                  {!expansionRenderContent &&
                    expansionComponent &&
                    React.createElement(expansionComponent, {
                      row: row.original,
                    })}
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))
      ) : (
        <TableRow>
          <TableCell
            colSpan={table.getAllColumns().length}
            className="h-24 text-center"
          >
            {emptyMessage || "No results."}
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}
