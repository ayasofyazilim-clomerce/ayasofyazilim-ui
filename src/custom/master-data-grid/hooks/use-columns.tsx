import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { GenericObjectType } from "@rjsf/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Save, X } from "lucide-react";
import { useMemo, type RefObject } from "react";
import { Button } from "../../../components/button";
import { Checkbox } from "../../../components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/dropdown-menu";
import type {
  CellProps,
  ColumnConfig,
  ExpandableColumnMeta,
  JSONSchema,
  MasterDataGridConfig,
  MasterDataGridResources,
} from "../types";
import {
  generateColumnsFromSchema,
  mergeColumns,
} from "../utils/column-generator";

export interface UseColumnsProps<TData> {
  config: MasterDataGridConfig<TData>;
  configRef: RefObject<MasterDataGridConfig<TData>>;
  schema?: JSONSchema | GenericObjectType;
  customColumns?: ColumnConfig<TData>[];
  enableRowSelection: boolean;
  enableColumnVisibility: boolean;
  editingRowsRef: RefObject<Record<string, Record<string, unknown>>>;
  updateCellValue: (rowId: string, columnId: string, value: unknown) => void;
  getRowId?: (row: TData, index: number) => string;
  t?: MasterDataGridResources;
  startEditingRow: (rowId: string, row: TData) => void;
  cancelEditingRow: (rowId: string, row: TData) => void;
  saveEditingRow: (rowId: string, row: TData) => Promise<void>;
}

export function useColumns<TData>({
  config,
  configRef,
  schema,
  customColumns,
  enableRowSelection,
  enableColumnVisibility,
  editingRowsRef,
  updateCellValue,
  getRowId,
  t,
  startEditingRow,
  cancelEditingRow,
  saveEditingRow,
}: UseColumnsProps<TData>): ColumnDef<TData>[] {
  return useMemo<ColumnDef<TData>[]>(() => {
    const editingContext = config.editing?.enabled
      ? {
          get editingRows() {
            return editingRowsRef.current;
          },
          onCellUpdate: updateCellValue,
          getRowId: getRowId || ((row: TData, index: number) => String(index)),
        }
      : undefined;

    const generatedColumns = schema
      ? generateColumnsFromSchema<TData>(
          schema,
          configRef.current.localization,
          t,
          editingContext,
          configRef.current.cellClassName,
          configRef.current.dateOptions,
          configRef.current.customRenderers,
          configRef.current.editing?.errorDisplayMode,
          enableColumnVisibility,
          config.expansion?.expanderColumns,
          config.schemaColumns
        )
      : [];

    // Auto-generate groupBy columns that were excluded by schemaColumns.
    // These are non-toggleable hidden columns required for grouping to work.
    const groupByKeys =
      (config.grouping?.groupBy as string[] | undefined) || [];
    const missingGroupByKeys = groupByKeys.filter(
      (key) => !generatedColumns.find((col) => col.id === key)
    );
    const groupByColumns =
      schema && missingGroupByKeys.length > 0
        ? generateColumnsFromSchema<TData>(
            schema,
            configRef.current.localization,
            t,
            editingContext,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            undefined,
            {
              mode: "include",
              columns: missingGroupByKeys as (keyof TData & string)[],
            }
          ).map((col) => ({
            ...col,
            enableHiding: false,
            enableColumnFilter: false,
          }))
        : [];

    const mergeContext = editingContext
      ? {
          get editingRows() {
            return editingRowsRef.current;
          },
          getRowId: editingContext.getRowId,
        }
      : undefined;

    const merged = mergeColumns<TData>(
      [...generatedColumns, ...groupByColumns],
      customColumns,
      mergeContext,
      enableColumnVisibility,
      t
    );

    const mergedWithExpansion = merged.map((col) => {
      const shouldExpandOnClick =
        (col.meta as ExpandableColumnMeta)?.isExpanderColumn ||
        customColumns?.find((c) => c.id === col.id)?.isExpanderColumn;

      if (!shouldExpandOnClick || !configRef.current.expansion?.enabled) {
        return col;
      }

      const originalCell = col.cell;
      return {
        ...col,
        cell: (props: CellProps<TData>) => {
          const content =
            typeof originalCell === "function"
              ? originalCell(props)
              : originalCell;

          return (
            <div
              onClick={(e) => {
                e.stopPropagation();
                props.row.toggleExpanded();
              }}
              className="cursor-pointer hover:bg-muted/50 h-full flex items-center px-2 expander"
            >
              {content}
            </div>
          );
        },
      };
    });

    const finalColumns: ColumnDef<TData>[] = [];

    if (enableRowSelection) {
      finalColumns.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label={t?.["select_all"]}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t?.["select_row"]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    finalColumns.push(...mergedWithExpansion);

    if (config.rowActions && config.rowActions.length > 0) {
      finalColumns.push({
        id: "actions",
        header: t?.["actions"],
        cell: ({ row }) => {
          const rowActions = config.rowActions?.filter((action) => {
            if (typeof action.hidden === "function") {
              return !action.hidden(row.original);
            }
            return !action.hidden;
          });

          if (!rowActions || rowActions.length === 0) return null;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="w-full"
                  aria-label={t?.["open_menu"]}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {rowActions.map((action) => {
                  const disabled =
                    typeof action.disabled === "function"
                      ? action.disabled(row.original)
                      : action.disabled;

                  // For custom render, let the rendered content handle onClick
                  if ("render" in action && action.render) {
                    return (
                      <DropdownMenuItem
                        key={action.id}
                        disabled={disabled}
                        className={cn("w-full", action.className)}
                        onSelect={(e) => e.preventDefault()}
                        asChild
                      >
                        {action.render(row.original)}
                      </DropdownMenuItem>
                    );
                  }

                  // For standard label action, handle onClick at DropdownMenuItem level
                  if ("label" in action) {
                    return (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={(e) => action.onClick?.(row.original, e)}
                        disabled={disabled}
                        className={action.className}
                      >
                        {action.icon && <action.icon className="size-3.5" />}
                        {typeof action.label === "function"
                          ? action.label(row.original)
                          : action.label}
                      </DropdownMenuItem>
                    );
                  }

                  return null;
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    if (config.editing?.enabled && config.editing.mode === "row") {
      finalColumns.push({
        id: "edit-actions",
        header: t?.["column.edit"] || "Edit",
        cell: ({ row }) => {
          const rowId = getRowId
            ? getRowId(row.original, row.index)
            : String(row.index);
          const isEditing = !!editingRowsRef.current[rowId];
          const isRowEditable =
            !config.editing?.isRowEditable ||
            config.editing.isRowEditable(row.original);

          if (!isRowEditable) return null;

          return (
            <div className="flex gap-1 px-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => saveEditingRow(rowId, row.original)}
                    className="h-7 px-2"
                    aria-label={t?.["save"]}
                  >
                    <Save className="size-3.5" />
                    {t?.["column.save"]}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelEditingRow(rowId, row.original)}
                    className="h-7 px-2"
                    aria-label={t?.["cancel"]}
                  >
                    <X className="size-3.5" />
                    {t?.["column.cancel"]}
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditingRow(rowId, row.original)}
                  className="h-7 px-2"
                  aria-label={t?.["edit"]}
                >
                  <Pencil className="size-3.5" />
                  {t?.["column.edit"]}
                </Button>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    if (config.columnOrder && config.columnOrder.length > 0) {
      const orderedColumns: ColumnDef<TData>[] = [];
      const columnMap = new Map(finalColumns.map((col) => [col.id, col]));

      for (const colId of config.columnOrder) {
        const col = columnMap.get(String(colId));
        if (col) {
          orderedColumns.push(col);
          columnMap.delete(String(colId));
        }
      }
      orderedColumns.push(...Array.from(columnMap.values()));

      return orderedColumns;
    }

    if (
      !config.columnOrder &&
      config.columnVisibility?.mode === "show" &&
      config.columnVisibility.columns.length > 0
    ) {
      const orderedColumns: ColumnDef<TData>[] = [];
      const columnMap = new Map(finalColumns.map((col) => [col.id, col]));

      for (const colId of config.columnVisibility.columns) {
        const col = columnMap.get(String(colId));
        if (col) {
          orderedColumns.push(col);
          columnMap.delete(String(colId));
        }
      }

      orderedColumns.push(...Array.from(columnMap.values()));

      return orderedColumns;
    }

    return finalColumns;
  }, [
    schema,
    customColumns,
    enableRowSelection,
    enableColumnVisibility,
    config.expansion,
    config.rowActions,
    config.editing,
    config.columnOrder,
    config.columnVisibility,
    config.schemaColumns,
    config.cellClassName,
    config.dateOptions,
    config.customRenderers,
    configRef,
    editingRowsRef,
    updateCellValue,
    getRowId,
    t,
    startEditingRow,
    cancelEditingRow,
    saveEditingRow,
  ]);
}
