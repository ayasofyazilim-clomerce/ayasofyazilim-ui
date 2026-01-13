"use no memo";
import type { Row, Table as TanStackTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { TableBody, TableCell, TableRow } from "../../../../components/table";
import { cn } from "../../../../lib/utils";
import {
  getPinningCellClassNames,
  getPinningCellStyles,
} from "../../utils/pinning-utils";

interface VirtualBodyProps<TData> {
  table: TanStackTable<TData>;
  rows: Row<TData>[];
  estimateSize?: number;
  overscan?: number;
  rowClassName?: string | ((row: TData) => string);
  cellClassName?: string | ((cell: { row: TData; columnId: string }) => string);
  editingRows?: Record<string, Record<string, unknown>>;
  getRowId?: (row: TData, index: number) => string;
  editingEnabled?: boolean;
}

/**
 * Virtualized table body for high-performance rendering
 */
export function VirtualBody<TData>({
  table,
  rows,
  estimateSize = 53,
  overscan = 10,
  rowClassName,
  cellClassName,
  editingRows,
  getRowId,
  editingEnabled,
}: VirtualBodyProps<TData>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
    <div
      ref={tableContainerRef}
      className="relative overflow-auto"
      style={{ height: "600px", width: "100%" }}
    >
      <table className="w-full caption-bottom text-sm">
        <TableBody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} />
            </tr>
          )}

          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return null;

            const rowClass =
              typeof rowClassName === "function"
                ? rowClassName(row.original)
                : rowClassName;

            return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(rowClass)}
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
                        isEditing && "py-0",
                        getPinningCellClassNames(cell),
                        editingEnabled &&
                          "border border-dashed border-muted-foreground/20",
                        editingEnabled &&
                          !isEditing &&
                          "hover:border-muted-foreground/40"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}

          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
        </TableBody>
      </table>
    </div>
  );
}
