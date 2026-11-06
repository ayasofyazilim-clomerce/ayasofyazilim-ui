"use no memo";
import type { Row } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import React from "react";
import { TableCell, TableRow } from "../../../../components/table";
import { cn } from "../../../../lib/utils";
import {
  getPinningCellClassNames,
  getPinningCellStyles,
} from "../../utils/pinning-utils";

export interface GridRowProps<TData> {
  row: Row<TData>;
  mode: "normal" | "virtual";
  rowClassName?: string | ((row: TData) => string);
  cellClassName?: string | ((cell: { row: TData; columnId: string }) => string);
  editingRows?: Record<string, Record<string, unknown>>;
  getRowId?: (row: TData, index: number) => string;
  editingEnabled?: boolean;
  expansionEnabled?: boolean;
  expansionRenderContent?: (row: TData) => React.ReactNode;
}

/** A data row plus its expansion row, shared by normal and virtual mode. */
export function GridRow<TData>({
  row,
  mode,
  rowClassName,
  cellClassName,
  editingRows,
  getRowId,
  editingEnabled,
  expansionEnabled,
  expansionRenderContent,
}: GridRowProps<TData>) {
  const isVirtual = mode === "virtual";
  return (
    <>
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        className={cn(
          typeof rowClassName === "function"
            ? rowClassName(row.original)
            : rowClassName,
          "group"
        )}
      >
        {row.getVisibleCells().map((cell, index) => {
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

          if (isVirtual) {
            return (
              <TableCell
                key={cell.id}
                style={getPinningCellStyles(cell)}
                className={cn(
                  cellClass,
                  isEditing && "py-0",
                  getPinningCellClassNames(cell),
                  "border-b border-r",
                  editingEnabled &&
                    "border border-dashed border-muted-foreground/20",
                  editingEnabled &&
                    !isEditing &&
                    "hover:border-muted-foreground/40"
                )}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            );
          }

          const isGroupedChild =
            index === 0 &&
            row.depth > 0 &&
            (() => {
              const pv = row.getParentRow()?.groupingValue;
              return pv != null && pv !== "null" && pv !== "";
            })();

          const isSelectionRow = cell.getContext().cell.column.id === "select";
          return (
            <TableCell
              key={cell.id}
              style={getPinningCellStyles(cell)}
              className={cn(
                cellClass,
                "last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0",
                getPinningCellClassNames(cell),
                isGroupedChild && "pl-9",
                isEditing && "py-0",
                editingEnabled && "border",
                editingEnabled &&
                  !isEditing &&
                  "hover:border-muted-foreground/40"
              )}
            >
              {isSelectionRow ? (
                <div className="flex items-center justify-center">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ) : (
                flexRender(cell.column.columnDef.cell, cell.getContext())
              )}
            </TableCell>
          );
        })}
      </TableRow>
      {row.getIsExpanded() && expansionEnabled && expansionRenderContent && (
        <TableRow>
          <TableCell
            className={isVirtual ? undefined : "has-[.pp-0]:p-0"}
            colSpan={row.getVisibleCells().length}
          >
            {expansionRenderContent(row.original)}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
