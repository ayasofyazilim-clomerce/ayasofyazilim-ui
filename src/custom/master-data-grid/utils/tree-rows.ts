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

/** Tree mode's default row id: `0`, `0.1`, `0.1.0`, ... unique at every depth. */
export function treeRowId(
  _row: unknown,
  index: number,
  parent?: { id: string }
): string {
  return parent ? `${parent.id}.${index}` : String(index);
}
