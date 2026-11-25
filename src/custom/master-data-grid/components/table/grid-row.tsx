"use no memo";
import type { RowEventsConfig } from "../../types";
import type { Row } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import React from "react";
import { TableCell, TableRow } from "../../../../components/table";
import { cn } from "../../../../lib/utils";
import {
  getPinningCellClassNames,
  getPinningCellStyles,
} from "../../utils/pinning-utils";
import {
  editingRowId,
  isGroupedChild as isGroupedChildRow,
  resolveCellClass,
  resolveRowClass,
  sameRenderState,
  sameTree,
  type RowRenderState,
} from "../../utils/row-memo";
import type { TreeRowsRender } from "../../utils/tree-rows";
import { TreeCell } from "./tree-cell";

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
  /** Set only when the grid has tree rows (`subRows`). */
  tree?: TreeRowsRender;
  /** Set only when the grid has row callbacks (`rowEvents`). */
  rowEvents?: RowEventsConfig<TData>;
  /**
   * Set only with `memoizeRows`: what the body resolved for this render (see
   * rowRenderState). The row and cell classes are drawn from it, so what the
   * memo compared is what is drawn.
   */
  renderState?: RowRenderState;
  /**
   * Set only by the windowed body (`windowedRows`). The row then carries
   * `data-index` (read when the window measures it), `aria-rowindex` and the
   * measuring `ref`, and its expansion row carries `data-windowed-expansion`.
   */
  windowed?: WindowedRowProps;
}

/** Where a windowed body draws a row (see GridRowProps.windowed). */
export interface WindowedRowProps {
  /** The row's position in the flattened visible rows. */
  index: number;
  /** Its `aria-rowindex`: the header rows plus `index` plus one. */
  ariaRowIndex: number;
  /** Measures the row (with its expansion row) for the window. */
  ref: (node: HTMLTableRowElement | null) => void;
}

/** Marks the expansion row of a windowed row, so it is measured with it. */
export const WINDOWED_EXPANSION_ATTR = "data-windowed-expansion";

/** A click that starts inside one of these belongs to that control. */
const ROW_CLICK_IGNORE =
  "a, button, input, select, textarea, label, [role=checkbox], [role=menuitem], [data-row-click-ignore]";

/** Handlers for a row, or none at all when no callback is given. */
function rowEventProps<TData>(
  original: TData,
  rowEvents: RowEventsConfig<TData> | undefined
): React.HTMLAttributes<HTMLTableRowElement> {
  const props: React.HTMLAttributes<HTMLTableRowElement> = {};
  const { onRowHover, onRowClick } = rowEvents ?? {};
  if (onRowHover) {
    props.onMouseEnter = () => onRowHover(original);
    props.onMouseLeave = () => onRowHover(null);
  }
  if (onRowClick) {
    props.onClick = (event) => {
      const rowEl = event.currentTarget;
      const target = event.target;
      // React bubbles portalled content (menus, dialogs) through the row;
      // those nodes are not inside it.
      if (!(target instanceof Element) || !rowEl.contains(target)) return;
      const hit = target.closest(ROW_CLICK_IGNORE);
      if (hit && rowEl.contains(hit)) return;
      onRowClick(original);
    };
  }
  return props;
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
  tree,
  rowEvents,
  renderState,
  windowed,
}: GridRowProps<TData>) {
  const isVirtual = mode === "virtual";
  return (
    <>
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        {...(windowed && {
          ref: windowed.ref,
          "data-index": windowed.index,
          "aria-rowindex": windowed.ariaRowIndex,
        })}
        {...rowEventProps(row.original, rowEvents)}
        className={cn(
          renderState
            ? renderState.rowClass
            : resolveRowClass(rowClassName, row.original),
          "group"
        )}
      >
        {row.getVisibleCells().map((cell, index) => {
          const cellClass = renderState
            ? renderState.cellClasses[index]
            : resolveCellClass(cellClassName, row.original, cell.column.id);

          const rowId = editingRowId(row, tree, getRowId);
          const isEditing = editingRows?.[rowId] !== undefined;
          const treeCell =
            tree && tree.expanderColumn === cell.column.id ? tree : undefined;
          const renderContent = () => {
            const rendered = flexRender(
              cell.column.columnDef.cell,
              cell.getContext()
            );
            return treeCell ? (
              <TreeCell row={row} tree={treeCell}>
                {rendered}
              </TreeCell>
            ) : (
              rendered
            );
          };

          if (isVirtual) {
            return (
              <TableCell
                key={cell.id}
                data-row-click-ignore={
                  rowEvents?.onRowClick &&
                  (cell.column.id === "select" || cell.column.id === "actions")
                    ? true
                    : undefined
                }
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
                {renderContent()}
              </TableCell>
            );
          }

          const isGroupedChild = index === 0 && isGroupedChildRow(row);

          const columnId = cell.getContext().cell.column.id;
          const isSelectionRow = columnId === "select";
          // The padding around a control belongs to it, not to the row.
          const ignoresRowClick =
            rowEvents?.onRowClick && (isSelectionRow || columnId === "actions")
              ? true
              : undefined;
          return (
            <TableCell
              key={cell.id}
              data-row-click-ignore={ignoresRowClick}
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
                  "hover:border-muted-foreground/40",
                // The has-[button]:px-0 rules above would drop the padding
                // only on rows with a toggle, shifting them off the spacer rows.
                treeCell && "px-2!"
              )}
            >
              {isSelectionRow ? (
                <div className="flex items-center justify-center">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ) : (
                renderContent()
              )}
            </TableCell>
          );
        })}
      </TableRow>
      {row.getIsExpanded() && expansionEnabled && expansionRenderContent && (
        <TableRow {...(windowed && { [WINDOWED_EXPANSION_ATTR]: "" })}>
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

/**
 * Whether a memoized row would draw the same thing again. The raw class
 * props, `editingRows` and `getRowId` are not compared: what they resolve to
 * for this row is in `renderState`. `rowEvents` is compared by its two
 * handlers, the only parts of it a row reads. A windowed row is compared by
 * its position (its index and `aria-rowindex`); its measuring ref is not
 * compared, as it only feeds the window.
 */
function sameRowRender<TData>(
  prev: GridRowProps<TData>,
  next: GridRowProps<TData>
): boolean {
  return (
    prev.renderState !== undefined &&
    next.renderState !== undefined &&
    prev.mode === next.mode &&
    prev.windowed?.index === next.windowed?.index &&
    prev.windowed?.ariaRowIndex === next.windowed?.ariaRowIndex &&
    prev.editingEnabled === next.editingEnabled &&
    prev.expansionEnabled === next.expansionEnabled &&
    prev.expansionRenderContent === next.expansionRenderContent &&
    prev.rowEvents?.onRowHover === next.rowEvents?.onRowHover &&
    prev.rowEvents?.onRowClick === next.rowEvents?.onRowClick &&
    sameTree(prev.tree, next.tree) &&
    sameRenderState(prev.renderState, next.renderState)
  );
}

/**
 * GridRow behind a memo, for `memoizeRows`: it re-renders only when its
 * `renderState` (built by the body with rowRenderState) or one of the props
 * compared in sameRowRender changes. Without a `renderState` it always
 * re-renders.
 */
export const MemoGridRow = React.memo(GridRow, sameRowRender) as <TData>(
  props: GridRowProps<TData>
) => React.ReactElement;
