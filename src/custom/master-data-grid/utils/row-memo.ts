import type { Row } from "@tanstack/react-table";
import type { TreeRowsRender } from "./tree-rows";

/**
 * Opt-in memoized rows (`memoizeRows`). A TanStack row object is reused across
 * renders while the state it reads (selection, expansion, the grouped depth)
 * changes inside the table, so a row cannot be compared by its object alone.
 * The body resolves, once per render, everything a row and its cells draw
 * from, and the memoized row compares that.
 */

type RowClassName<TData> = string | ((row: TData) => string);
type CellClassName<TData> =
  string | ((cell: { row: TData; columnId: string }) => string);

/** A row's class, as GridRow draws it (before "group" is added). */
export function resolveRowClass<TData>(
  rowClassName: RowClassName<TData> | undefined,
  original: TData
): string | undefined {
  return typeof rowClassName === "function"
    ? rowClassName(original)
    : rowClassName;
}

/** One cell's class, as GridRow draws it. */
export function resolveCellClass<TData>(
  cellClassName: CellClassName<TData> | undefined,
  original: TData,
  columnId: string
): string | undefined {
  return typeof cellClassName === "function"
    ? cellClassName({ row: original, columnId })
    : cellClassName;
}

/**
 * The key a row's edits are kept under. `row.index` counts within the parent,
 * so a tree row is keyed by its id, which is unique at every depth.
 */
export function editingRowId<TData>(
  row: Row<TData>,
  tree: TreeRowsRender | undefined,
  getRowId: ((row: TData, index: number) => string) | undefined
): string {
  return tree
    ? row.id
    : getRowId
      ? getRowId(row.original, row.index)
      : String(row.index);
}

/** A row under a named group: normal mode indents its first cell. */
export function isGroupedChild<TData>(row: Row<TData>): boolean {
  if (row.depth <= 0) return false;
  const pv = row.getParentRow()?.groupingValue;
  return pv != null && pv !== "null" && pv !== "";
}

export interface RowRenderOptions<TData> {
  mode: "normal" | "virtual";
  rowClassName?: RowClassName<TData>;
  cellClassName?: CellClassName<TData>;
  editingRows?: Record<string, Record<string, unknown>>;
  getRowId?: (row: TData, index: number) => string;
  tree?: TreeRowsRender;
}

/** What one body row draws from in one render (see rowRenderState). */
export interface RowRenderState {
  /** The row's class, resolved. */
  rowClass: string | undefined;
  /** Each visible cell's class, resolved, in the order the cells are drawn. */
  cellClasses: (string | undefined)[];
  /** Everything else the row and its cells read, compared item by item. */
  deps: readonly unknown[];
}

/**
 * Resolves what `row` draws from in this render. Two renders with equal
 * states (sameRenderState) draw the same row, given the stable inputs the
 * docs list (cells that read only their row, their column and React state or
 * context).
 *
 * `deps` holds, in order:
 * - the row object and its `original` (a data change makes new row objects);
 * - its id, index, depth and parentId (grouping rewrites depth and parentId
 *   on the same row object), and whether normal mode indents it as a grouped
 *   child;
 * - its selected, some- and all-sub-rows-selected and can-select state, and
 *   its expanded and can-expand state, read from the table now;
 * - its entry in the editing rows (a new object on every edit to that row);
 * - per visible cell, in drawing order: the column object (a new one whenever
 *   the column definitions change, with their cell renderers and sizes), its
 *   pinned side, its sticky offset, its size, and the column's own table
 *   state a cell may show: its filter value, its sort direction and whether
 *   it is grouped. These are not implied by the row: a row that still passes
 *   a filter keeps its row object, and so does every row under a manual
 *   (server) sort or grouping state with no grouped row model. Together these
 *   cover the column set, order, visibility, pinning, sizing, filter, sort
 *   and grouping.
 *
 * Not covered: anything a cell reads through `getContext().table` (another
 * column's state, other rows, the global filter), column facets, refs and
 * module variables.
 */
export function rowRenderState<TData>(
  row: Row<TData>,
  {
    mode,
    rowClassName,
    cellClassName,
    editingRows,
    getRowId,
    tree,
  }: RowRenderOptions<TData>
): RowRenderState {
  const cells = row.getVisibleCells();
  const deps: unknown[] = [
    row,
    row.original,
    row.id,
    row.index,
    row.depth,
    row.parentId,
    mode === "normal" && cells.length > 0 && isGroupedChild(row),
    row.getIsSelected(),
    row.getIsSomeSelected(),
    row.getIsAllSubRowsSelected(),
    row.getCanSelect(),
    row.getIsExpanded(),
    row.getCanExpand(),
    editingRows?.[editingRowId(row, tree, getRowId)],
  ];
  const cellClasses: (string | undefined)[] = [];
  for (const cell of cells) {
    const { column } = cell;
    const pinned = column.getIsPinned();
    cellClasses.push(resolveCellClass(cellClassName, row.original, column.id));
    deps.push(
      column,
      pinned,
      pinned === "left" ? column.getStart("left") : undefined,
      pinned === "right" ? column.getAfter("right") : undefined,
      column.getSize(),
      column.getFilterValue(),
      column.getIsSorted(),
      column.getIsGrouped()
    );
  }
  return {
    rowClass: resolveRowClass(rowClassName, row.original),
    cellClasses,
    deps,
  };
}

const sameItems = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((item, i) => Object.is(item, b[i]));

export function sameRenderState(a: RowRenderState, b: RowRenderState) {
  return (
    a.rowClass === b.rowClass &&
    sameItems(a.cellClasses, b.cellClasses) &&
    sameItems(a.deps, b.deps)
  );
}

/** Tree options by value: the grid builds a new object every render. */
export function sameTree(
  a: TreeRowsRender | undefined,
  b: TreeRowsRender | undefined
) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.expanderColumn === b.expanderColumn &&
    a.indent === b.indent &&
    a.labels.expand === b.labels.expand &&
    a.labels.collapse === b.labels.collapse
  );
}
