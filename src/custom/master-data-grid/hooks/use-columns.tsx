import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Save,
  X,
} from "lucide-react";
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
} from "../types";
import {
  generateColumnsFromSchema,
  mergeColumns,
} from "../utils/column-generator";
import { GenericObjectType } from "@rjsf/utils";

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
  t?: Record<string, string>;
  onFilterClick: (columnId: string) => void;
  startEditingRow: (rowId: string, row: TData) => void;
  cancelEditingRow: (rowId: string, row: TData) => void;
  saveEditingRow: (rowId: string, row: TData) => Promise<void>;
}

/**
 * Hook for generating and managing table columns
 * Consolidates the complex column generation logic from the main component
 */
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
  onFilterClick,
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

    // Get expandOnClick columns
    const expandOnClickColumns = config.expansion?.expandOnClick
      ? Array.isArray(config.expansion.expandOnClick)
        ? config.expansion.expandOnClick
        : [config.expansion.expandOnClick]
      : [""];

    // Generate columns from schema
    const generatedColumns = schema
      ? generateColumnsFromSchema<TData>(
          schema,
          configRef.current.localization,
          t,
          onFilterClick,
          editingContext,
          configRef.current.cellClassName,
          configRef.current.dateOptions,
          configRef.current.customRenderers,
          configRef.current.editing?.errorDisplayMode,
          enableColumnVisibility,
          expandOnClickColumns
        )
      : [];

    // Create a simpler context for merging (no onCellUpdate needed)
    const mergeContext = editingContext
      ? {
          get editingRows() {
            return editingRowsRef.current;
          },
          getRowId: editingContext.getRowId,
        }
      : undefined;

    // Merge with custom columns
    const merged = mergeColumns<TData>(
      generatedColumns,
      customColumns,
      mergeContext,
      enableColumnVisibility,
      t,
      onFilterClick
    );

    // Wrap cells with expandOnClick handlers

    const mergedWithExpansion = merged.map((col) => {
      const shouldExpandOnClick =
        (col.meta as ExpandableColumnMeta)?.expandOnClick ||
        customColumns?.find((c) => c.id === col.id)?.expandOnClick;

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
              className="cursor-pointer hover:bg-muted/50"
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
            aria-label={t?.["select_all"] || "Select all"}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t?.["select_row"] || "Select row"}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    // Add data columns
    finalColumns.push(...mergedWithExpansion);

    // Add row actions column if enabled
    if (config.rowActions && config.rowActions.length > 0) {
      finalColumns.push({
        id: "actions",
        header: t?.["actions"] || "Actions",
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
                  className="h-8 w-8 p-0"
                  aria-label={t?.["open_menu"] || "Open menu"}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {rowActions.map((action) => {
                  const label =
                    typeof action.label === "function"
                      ? action.label(row.original)
                      : action.label;
                  const disabled =
                    typeof action.disabled === "function"
                      ? action.disabled(row.original)
                      : action.disabled;

                  return (
                    <DropdownMenuItem
                      key={action.id}
                      onClick={(e) => action.onClick?.(row.original, e)}
                      disabled={disabled}
                      className={action.className}
                    >
                      {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                      {label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    // Add edit actions column if inline editing is enabled
    if (config.editing?.enabled && config.editing.mode === "row") {
      finalColumns.push({
        id: "edit-actions",
        header: t?.["edit"] || "Edit",
        cell: ({ row }) => {
          const rowId = getRowId
            ? getRowId(row.original, row.index)
            : String(row.index);
          const isEditing = !!editingRowsRef.current[rowId];
          const isRowEditable =
            !config.editing?.isRowEditable ||
            config.editing.isRowEditable(row.original);

          if (!isRowEditable) return null;

          return isEditing ? (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => saveEditingRow(rowId, row.original)}
                className="h-7 px-2"
                aria-label={t?.["save"] || "Save"}
              >
                <Save className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cancelEditingRow(rowId, row.original)}
                className="h-7 px-2"
                aria-label={t?.["cancel"] || "Cancel"}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEditingRow(rowId, row.original)}
              className="h-7 px-2"
              aria-label={t?.["edit"] || "Edit"}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    // Apply column order if specified
    if (config.columnOrder && config.columnOrder.length > 0) {
      const orderedColumns: ColumnDef<TData>[] = [];
      const columnMap = new Map(finalColumns.map((col) => [col.id, col]));

      // Add columns in the specified order
      for (const colId of config.columnOrder) {
        const col = columnMap.get(String(colId));
        if (col) {
          orderedColumns.push(col);
          columnMap.delete(String(colId));
        }
      }

      // Add any remaining columns that weren't in the order
      orderedColumns.push(...Array.from(columnMap.values()));

      return orderedColumns;
    }

    // If no column order but columnVisibility mode is "show", use show config order
    if (
      !config.columnOrder &&
      config.columnVisibility?.mode === "show" &&
      config.columnVisibility.columns.length > 0
    ) {
      const orderedColumns: ColumnDef<TData>[] = [];
      const columnMap = new Map(finalColumns.map((col) => [col.id, col]));

      // Add columns in the visibility show order
      for (const colId of config.columnVisibility.columns) {
        const col = columnMap.get(String(colId));
        if (col) {
          orderedColumns.push(col);
          columnMap.delete(String(colId));
        }
      }

      // Add any remaining columns (system columns like expander, select, actions)
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
    config.cellClassName,
    config.dateOptions,
    config.customRenderers,
    configRef,
    editingRowsRef,
    updateCellValue,
    getRowId,
    t,
    onFilterClick,
    startEditingRow,
    cancelEditingRow,
    saveEditingRow,
  ]);
}
