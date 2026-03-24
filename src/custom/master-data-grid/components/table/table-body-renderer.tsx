"use no memo";
import type { Row, Table as TanStackTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import { Button } from "../../../../components/button";
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
  bodyClassName?: string;
  hideNullGroups?: boolean;
  groupRowLookup?: Map<string, unknown>;
  hideGroupParentRows?: boolean;
  groupFallbackRenderer?: (props: {
    groupValue: string;
    subRows: Record<string, unknown>[];
    subRowCount: number;
    isExpanded: boolean;
    toggle: () => void;
  }) => React.ReactNode;
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
  bodyClassName,
  hideNullGroups,
  groupRowLookup,
  hideGroupParentRows,
  groupFallbackRenderer,
}: TableBodyRendererProps<TData>) {
  const groupValueSet = React.useMemo(() => {
    if (!hideGroupParentRows) return null;
    const set = new Set<string>();
    rows.forEach((row) => {
      if (
        row.getIsGrouped() &&
        row.groupingValue != null &&
        row.groupingValue !== "null" &&
        row.groupingValue !== ""
      ) {
        set.add(String(row.groupingValue));
      }
    });
    return set;
  }, [hideGroupParentRows, rows]);

  const parentRowLookup = React.useMemo(() => {
    if (!hideGroupParentRows) return null;
    const map = new Map<string, (typeof rows)[number]>();
    table.getCoreRowModel().flatRows.forEach((r) => {
      const id = (r.original as Record<string, unknown>)["id"];
      if (id != null) map.set(String(id), r);
    });
    return map;
  }, [hideGroupParentRows, rows]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TableBody className={bodyClassName}>
      {rows.length ? (
        rows.map((row) => {
          if (!row.getIsGrouped() && groupValueSet) {
            const rowId = (row.original as Record<string, unknown>)["id"];
            if (rowId != null && groupValueSet.has(String(rowId))) return null;
          }
          return (
            <React.Fragment key={row.id}>
              {row.getIsGrouped() ? (
                hideNullGroups &&
                (row.groupingValue == null ||
                  row.groupingValue === "null" ||
                  row.groupingValue === "") ? null : (
                  (() => {
                    const parentRow = hideGroupParentRows
                      ? parentRowLookup?.get(String(row.groupingValue))
                      : undefined;
                    if (parentRow) {
                      return (
                        <TableRow
                          className={cn(
                            typeof rowClassName === "function"
                              ? rowClassName(parentRow.original)
                              : rowClassName,
                            "group"
                          )}
                        >
                          {parentRow.getVisibleCells().map((cell, index) => {
                            const cellClass =
                              typeof cellClassName === "function"
                                ? cellClassName({
                                    row: parentRow.original,
                                    columnId: cell.column.id,
                                  })
                                : cellClassName;
                            return (
                              <TableCell
                                key={cell.id}
                                style={getPinningCellStyles(cell)}
                                className={cn(
                                  cellClass,
                                  "last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0",
                                  getPinningCellClassNames(cell)
                                )}
                              >
                                {index === 0 ? (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      onClick={row.getToggleExpandedHandler()}
                                      aria-label={
                                        row.getIsExpanded()
                                          ? "Collapse"
                                          : "Expand"
                                      }
                                    >
                                      {row.getIsExpanded() ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </div>
                                ) : (
                                  flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    }
                    return (
                      <TableRow
                        className="bg-muted/30 hover:bg-muted/50 cursor-pointer font-medium"
                        onClick={row.getToggleExpandedHandler()}
                      >
                        <TableCell
                          colSpan={row.getVisibleCells().length}
                          className="py-0 h-9"
                          style={{
                            paddingLeft: `${row.depth * 1.5 + 0.75}rem`,
                          }}
                        >
                          {groupFallbackRenderer ? (
                            groupFallbackRenderer({
                              groupValue: String(row.groupingValue ?? ""),
                              subRows: row.subRows.map(
                                (r) => r.original as Record<string, unknown>
                              ),
                              subRowCount: row.subRows.length,
                              isExpanded: row.getIsExpanded(),
                              toggle: row.getToggleExpandedHandler(),
                            })
                          ) : (
                            <div className="flex items-center gap-2">
                              {row.getIsExpanded() ? (
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                              <span>
                                {(() => {
                                  const val = row.groupingValue;
                                  if (
                                    val == null ||
                                    val === "null" ||
                                    val === ""
                                  )
                                    return "—";
                                  const key = String(val);
                                  return groupRowLookup?.has(key)
                                    ? String(groupRowLookup.get(key) ?? key)
                                    : key;
                                })()}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                ({row.subRows.length})
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })()
                )
              ) : (
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

                      const isGroupedChild =
                        index === 0 &&
                        row.depth > 0 &&
                        (() => {
                          const pv = row.getParentRow()?.groupingValue;
                          return pv != null && pv !== "null" && pv !== "";
                        })();
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
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {row.getIsExpanded() &&
                    expansionEnabled &&
                    expansionRenderContent && (
                      <TableRow>
                        <TableCell
                          className="has-[.pp-0]:p-0"
                          colSpan={row.getVisibleCells().length}
                        >
                          {expansionRenderContent(row.original)}
                        </TableCell>
                      </TableRow>
                    )}
                </>
              )}
            </React.Fragment>
          );
        })
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
