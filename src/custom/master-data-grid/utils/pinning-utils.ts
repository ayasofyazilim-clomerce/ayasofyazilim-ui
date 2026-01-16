import type { Header, Cell } from "@tanstack/react-table";
import type { CSSProperties } from "react";

/**
 * Get pinning styles for a table header
 */
export function getPinningStyles<TData>(
  header: Header<TData, unknown>
): CSSProperties {
  const pinned = header.column.getIsPinned();
  return {
    left: pinned === "left" ? `${header.column.getStart("left")}px` : undefined,
    right:
      pinned === "right" ? `${header.column.getAfter("right")}px` : undefined,
    position: pinned ? "sticky" : "relative",
    zIndex: pinned ? 1 : 0,
  };
}

/**
 * Get pinning class names for a table header
 */
export function getPinningHeaderClassNames<TData>(
  header: Header<TData, unknown>
): string {
  const pinned = header.column.getIsPinned();
  const classes: string[] = [];

  if (pinned) {
    classes.push("bg-background");
  }
  if (pinned === "left") {
    classes.push("shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]");
  }
  if (pinned === "right") {
    classes.push("shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]");
  }

  return classes.join(" ");
}

/**
 * Get pinning styles for a table cell
 */
export function getPinningCellStyles<TData>(
  cell: Cell<TData, unknown>
): CSSProperties {
  const pinned = cell.column.getIsPinned();

  return {
    width: cell.column.getSize(),
    minWidth: pinned
      ? cell.column.getSize()
      : cell.column.columnDef.minSize || cell.column.getSize(),
    maxWidth: pinned
      ? cell.column.columnDef.maxSize // Use defined maxSize or no limit
      : cell.column.columnDef.maxSize || cell.column.getSize(),
    left: pinned === "left" ? `${cell.column.getStart("left")}px` : undefined,
    right:
      pinned === "right" ? `${cell.column.getAfter("right")}px` : undefined,
    position: pinned ? "sticky" : "relative",
    zIndex: pinned ? 1 : 0,
  };
}

/**
 * Get pinning class names for a table cell
 */
export function getPinningCellClassNames<TData>(
  cell: Cell<TData, unknown>
): string {
  const pinned = cell.column.getIsPinned();
  const classes: string[] = [];

  if (pinned) {
    classes.push("bg-background", "overflow-hidden", "text-ellipsis");
  }
  if (pinned === "left") {
    classes.push("shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]");
  }
  if (pinned === "right") {
    classes.push("shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]");
  }

  return classes.join(" ");
}
