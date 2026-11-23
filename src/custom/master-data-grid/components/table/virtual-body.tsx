"use no memo";
import type { Row } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useRef } from "react";
import { TableBody } from "../../../../components/table";
import { GridRow, MemoGridRow, type GridRowProps } from "./grid-row";
import type { RowEventsConfig } from "../../types";
import { rowRenderState } from "../../utils/row-memo";
import type { TreeRowsRender } from "../../utils/tree-rows";

interface VirtualBodyProps<TData> {
  rows: Row<TData>[];
  estimateSize?: number;
  overscan?: number;
  rowClassName?: string | ((row: TData) => string);
  cellClassName?: string | ((cell: { row: TData; columnId: string }) => string);
  editingRows?: Record<string, Record<string, unknown>>;
  getRowId?: (row: TData, index: number) => string;
  editingEnabled?: boolean;
  expansionEnabled?: boolean;
  expansionRenderContent?: (row: TData) => React.ReactNode;
  /** Set only when the grid has tree rows (`subRows`). */
  tree?: TreeRowsRender;
  /** Set only when the grid has row callbacks (`rowEvents`). */
  rowEvents?: RowEventsConfig<TData>;
  /** `memoizeRows`: each data row re-renders only when what it draws changes. */
  memoizeRows?: boolean;
}

export function VirtualBody<TData>({
  rows,
  estimateSize = 53,
  overscan = 10,
  rowClassName,
  cellClassName,
  editingRows,
  getRowId,
  editingEnabled,
  expansionEnabled,
  expansionRenderContent,
  tree,
  rowEvents,
  memoizeRows,
}: VirtualBodyProps<TData>) {
  const tableContainerRef = useRef<HTMLTableSectionElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => {
      return tableContainerRef.current?.closest(
        ".overflow-auto"
      ) as HTMLElement | null;
    },
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
    <TableBody ref={tableContainerRef}>
      {paddingTop > 0 && (
        <tr>
          <td style={{ height: `${paddingTop}px` }} />
        </tr>
      )}

      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) return null;

        const rowProps: GridRowProps<TData> = {
          row,
          mode: "virtual",
          rowClassName,
          cellClassName,
          editingRows,
          getRowId,
          editingEnabled,
          expansionEnabled,
          expansionRenderContent,
          tree,
          rowEvents,
        };
        return memoizeRows ? (
          <MemoGridRow
            key={row.id}
            {...rowProps}
            renderState={rowRenderState(row, rowProps)}
          />
        ) : (
          <GridRow key={row.id} {...rowProps} />
        );
      })}

      {paddingBottom > 0 && (
        <tr>
          <td style={{ height: `${paddingBottom}px` }} />
        </tr>
      )}
    </TableBody>
  );
}
