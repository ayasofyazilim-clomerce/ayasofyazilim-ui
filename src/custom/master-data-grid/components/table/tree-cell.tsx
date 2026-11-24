"use client";
"use no memo";
import type { Row } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import { Button } from "../../../../components/button";
import type { TreeRowsRender } from "../../utils/tree-rows";

export interface TreeCellProps<TData> {
  row: Row<TData>;
  tree: TreeRowsRender;
  children: React.ReactNode;
}

/**
 * The tree column's content: indented by depth, with a toggle for a row that
 * has children and a spacer of the same width for one that does not, so the
 * column's values line up at every depth.
 */
export function TreeCell<TData>({ row, tree, children }: TreeCellProps<TData>) {
  const isExpanded = row.getIsExpanded();
  return (
    <div
      data-slot="tree-cell"
      className="flex h-full min-w-0 items-center gap-1"
      style={{ paddingLeft: `${row.depth * tree.indent}rem` }}
    >
      {row.getCanExpand() ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? tree.labels.collapse : tree.labels.expand}
          onClick={(event) => {
            event.stopPropagation();
            row.toggleExpanded();
          }}
        >
          {isExpanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </Button>
      ) : (
        <span
          data-slot="tree-spacer"
          aria-hidden="true"
          className="size-6 shrink-0"
        />
      )}
      {children}
    </div>
  );
}
