import type { Row, RowSelectionState, Table } from "@tanstack/react-table";
import type { MasterDataGridConfig, SubRowsConfig } from "../types";

export const DEFAULT_TREE_INDENT = 1.25;
export const DEFAULT_TREE_LABELS = {
  expand: "Expand row",
  collapse: "Collapse row",
};

/** What GridRow needs to draw the tree column, with the defaults applied. */
export interface TreeRowsRender {
  expanderColumn: string;
  indent: number;
  labels: { expand: string; collapse: string };
}

/**
 * The option that keeps `subRows` from taking effect, or null. Grouping and
 * expansion detail rows draw rows of their own and share TanStack's one
 * `expanded` state, so neither combines with tree rows.
 */
export function subRowsConflict<TData>(
  config: MasterDataGridConfig<TData>
): "grouping.enabled" | "expansion.renderContent" | null {
  if (!config.subRows) return null;
  if (config.grouping?.enabled) return "grouping.enabled";
  if (config.expansion?.renderContent) return "expansion.renderContent";
  return null;
}

/**
 * The tree-row config a grid runs with: undefined without `subRows`, and
 * undefined when `subRows` conflicts (that grid renders as if it were absent).
 */
export function activeSubRows<TData>(
  config: MasterDataGridConfig<TData>
): SubRowsConfig<TData> | undefined {
  return config.subRows && !subRowsConflict(config)
    ? config.subRows
    : undefined;
}

export function treeRowsRender<TData>(
  subRows: SubRowsConfig<TData>
): TreeRowsRender {
  return {
    expanderColumn: subRows.expanderColumn,
    indent: subRows.indent ?? DEFAULT_TREE_INDENT,
    labels: {
      expand: subRows.labels?.expand ?? DEFAULT_TREE_LABELS.expand,
      collapse: subRows.labels?.collapse ?? DEFAULT_TREE_LABELS.collapse,
    },
  };
}

/**
 * The rows a tree grid's select-all covers: every selectable row of the current
 * page, at any depth, expanded or not. One set drives the box's checked and
 * disabled state and what it toggles.
 *
 * TanStack's own page helpers do not fit tree rows: toggleAllPageRowsSelected
 * walks only the visible rows (and, with enableSubRowSelection off, never
 * their children), while getIsAllPageRowsSelected reads the pagination
 * model's flatRows, which repeat expanded rows on a client-paged grid and drop
 * every child once a filter is active (filtering is top-level). So walk the
 * page's top-level rows down through their children instead.
 */
export function selectablePageTreeRows<TData>(
  table: Table<TData>
): Row<TData>[] {
  const rows: Row<TData>[] = [];
  const visit = (row: Row<TData>) => {
    if (row.getCanSelect()) rows.push(row);
    row.subRows.forEach(visit);
  };
  table
    .getRowModel()
    .rows.filter((row) => row.depth === 0)
    .forEach(visit);
  return rows;
}

/** `selection` with each of `rows` set (or cleared), every other id kept. */
export function withRowsSelected<TData>(
  selection: RowSelectionState,
  rows: Row<TData>[],
  selected: boolean
): RowSelectionState {
  const next = { ...selection };
  rows.forEach((row) => {
    if (selected) next[row.id] = true;
    else delete next[row.id];
  });
  return next;
}

/** Tree mode's default row id: `0`, `0.1`, `0.1.0`, ... unique at every depth. */
export function treeRowId(
  _row: unknown,
  index: number,
  parent?: { id: string }
): string {
  return parent ? `${parent.id}.${index}` : String(index);
}
