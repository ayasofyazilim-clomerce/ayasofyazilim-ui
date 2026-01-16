import type { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { Button } from "../../../components/button";
import { Checkbox } from "../../../components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/dropdown-menu";
import type {
  MasterDataGridConfig,
  ColumnConfig,
  CellProps,
  ExpandableColumnMeta,
} from "../types";
import {
  generateColumnsFromSchema,
  mergeColumns,
} from "../utils/column-generator";

export interface BuildColumnsOptions<TData> {
  config: MasterDataGridConfig<TData>;
  customColumns?: ColumnConfig<TData>[];
  enableRowSelection: boolean;
  enableColumnVisibility: boolean;
  expandOnClickColumns: string[];
  t?: Record<string, string>;
  handleFilterClick: (columnId: string) => void;
  editingContext?: {
    editingRows: Record<string, Record<string, unknown>>;
    onCellUpdate: (rowId: string, columnId: string, value: unknown) => void;
    getRowId: (row: TData, index: number) => string;
  };
  startEditingRow: (rowId: string, row: TData) => void;
  cancelEditingRow: (rowId: string, row: TData) => void;
  saveEditingRow: (rowId: string, row: TData) => Promise<void>;
  getRowId?: (row: TData, index: number) => string;
}

/**
 * Custom global filter function
 */
export function createGlobalFilterFn<TData>(): FilterFn<TData> {
  return (row, columnId, filterValue) => {
    const search = String(filterValue).toLowerCase();

    // Search across all visible columns
    return Object.values(row.original as Record<string, unknown>).some(
      (value) => {
        if (value == null) return false;
        return String(value).toLowerCase().includes(search);
      }
    );
  };
}

/**
 * Build all columns for the table including expander, selection, data, editing, and actions
 */
export function buildColumns<TData>({
  config,
  customColumns,
  enableRowSelection,
  enableColumnVisibility,
  expandOnClickColumns,
  t,
  handleFilterClick,
  editingContext,
  startEditingRow,
  cancelEditingRow,
  saveEditingRow,
  getRowId: getRowIdFn,
}: BuildColumnsOptions<TData>): ColumnDef<TData>[] {
  const {
    schema,
    localization,
    cellClassName,
    dateOptions,
    customRenderers,
    editing,
    expansion,
    rowActions,
  } = config;

  // Generate columns from schema
  const generatedColumns = schema
    ? generateColumnsFromSchema<TData>(
        schema,
        localization,
        t,
        handleFilterClick,
        editingContext,
        cellClassName,
        dateOptions,
        customRenderers,
        editing?.errorDisplayMode,
        enableColumnVisibility,
        expandOnClickColumns
      )
    : [];

  // Merge with custom columns
  const mergeContext = editingContext
    ? {
        get editingRows() {
          return editingContext.editingRows;
        },
        getRowId: editingContext.getRowId,
      }
    : undefined;

  const merged = mergeColumns<TData>(
    generatedColumns,
    customColumns,
    mergeContext,
    enableColumnVisibility,
    t,
    handleFilterClick
  );

  // Wrap cells with expandOnClick handlers
  const hasExpandOnClickConfig =
    expandOnClickColumns.length > 0 ||
    customColumns?.some((c) => c.expandOnClick);

  const mergedWithExpansion = merged.map((col) => {
    const shouldExpandOnClick =
      (col.meta as ExpandableColumnMeta)?.expandOnClick ||
      (col.id && expandOnClickColumns.includes(col.id));

    if (!shouldExpandOnClick || !expansion?.enabled) {
      return col;
    }

    const originalCell = col.cell;
    return {
      ...col,
      cell: (props: CellProps<TData>) => {
        const cellContent =
          typeof originalCell === "function"
            ? originalCell(props)
            : originalCell;

        return (
          <div
            className="cursor-pointer"
            onClick={() => props.row.toggleExpanded()}
          >
            {cellContent}
          </div>
        );
      },
    };
  });

  const finalColumns: ColumnDef<TData>[] = [];

  // Add expander column if enabled
  if (expansion?.enabled) {
    finalColumns.push({
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        return row.getCanExpand() ? (
          <button onClick={() => row.toggleExpanded()} className="p-1">
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : null;
      },
      enableSorting: false,
      enableHiding: false,
    });
  }

  // Add selection column if enabled
  if (enableRowSelection) {
    finalColumns.push({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    });
  }

  // Add data columns
  finalColumns.push(...mergedWithExpansion);

  // Add edit/save/cancel column if editing is enabled
  if (editing?.enabled && editing?.mode === "row") {
    finalColumns.push({
      id: "edit-actions",
      header: () => <div className="text-right">Edit</div>,
      cell: ({ row }) => {
        const rowId = getRowIdFn
          ? getRowIdFn(row.original, row.index)
          : String(row.index);
        const isEditing = editingContext?.editingRows[rowId] !== undefined;

        return (
          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => saveEditingRow(rowId, row.original)}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelEditingRow(rowId, row.original)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditingRow(rowId, row.original)}
                disabled={
                  editing.isRowEditable && !editing.isRowEditable(row.original)
                }
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    });
  }

  // Add actions column if row actions are defined
  if (rowActions && rowActions.length > 0) {
    finalColumns.push({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const rowData = row.original;
        const visibleActions = rowActions.filter((action) => {
          const hidden =
            typeof action.hidden === "function"
              ? action.hidden(rowData)
              : action.hidden;
          return !hidden;
        });

        if (visibleActions.length === 0) return null;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {visibleActions.map((action) => {
                  const disabled =
                    typeof action.disabled === "function"
                      ? action.disabled(rowData)
                      : action.disabled;
                  const label =
                    typeof action.label === "function"
                      ? action.label(rowData)
                      : action.label;
                  const Icon = action.icon;

                  return (
                    <DropdownMenuItem
                      key={action.id}
                      disabled={disabled}
                      onClick={(e) => action.onClick?.(rowData, e)}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    });
  }

  return finalColumns;
}
