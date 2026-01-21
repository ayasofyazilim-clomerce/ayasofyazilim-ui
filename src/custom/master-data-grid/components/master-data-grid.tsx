"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { Button } from "../../../components/button";
import { Checkbox } from "../../../components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/dropdown-menu";
import { Skeleton } from "../../../components/skeleton";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/table";
import { cn } from "../../../lib/utils";
import type {
  CellProps,
  ColumnFilter,
  ExpandableColumnMeta,
  FilterDialogState,
  MasterDataGridConfig,
  MasterDataGridProps,
  TableState,
} from "../types";
import { exportToCSV } from "../utils/export-utils";
import {
  getPinningHeaderClassNames,
  getPinningStyles,
} from "../utils/pinning-utils";
import { getTranslations } from "../utils/translation-utils";
import { ColumnSettingsDialog } from "./dialogs/column-settings-dialog";
import { FilterDialog } from "./filters/filter-dialog";
import { Pagination } from "./pagination";
import { TableBodyRenderer, VirtualBody } from "./table";
import { Toolbar } from "./toolbar";
import {
  generateColumnsFromSchema,
  mergeColumns,
} from "../utils/column-generator";
import { useEditing } from "../hooks/use-editing";
import { useColumns } from "../hooks/use-columns";
import { useTableStateReducer } from "../hooks/use-table-state-reducer";

/** Default number of skeleton rows to display during loading */
const DEFAULT_SKELETON_ROWS = 5;

/** Component name for logging */
const COMPONENT_NAME = "MasterDataGrid";

/**
 * Helper function for consistent error logging
 * @param message - Error message
 * @param data - Optional additional data
 */
const logError = (message: string, data?: unknown) => {
  console.error(`[${COMPONENT_NAME}] ${message}`, data || "");
};

/**
 * Helper function for consistent warning logging
 * @param message - Warning message
 * @param data - Optional additional data
 */
const logWarning = (message: string, data?: unknown) => {
  console.warn(`[${COMPONENT_NAME}] ${message}`, data || "");
};

/**
 * MasterDataGrid - Enterprise-grade data table component
 *
 * @description A comprehensive, production-ready data grid with advanced features:
 * - Schema-driven column generation from JSON Schema
 * - Virtual scrolling for 100k+ rows with smooth performance
 * - Advanced filtering with 18+ operators (equals, contains, between, etc.)
 * - Multi-column sorting and grouping
 * - Column pinning, resizing, and reordering
 * - Row selection with bulk actions
 * - Inline row editing with validation
 * - CSV export with custom formatting
 * - Responsive pagination with URL synchronization
 * - Full TypeScript support with generic types
 * - Internationalization (i18n) support
 *
 * @template TData - The type of data objects in the table
 *
 * @param {TData[]} data - Array of data objects to display
 * @param {MasterDataGridConfig<TData>} config - Comprehensive configuration object
 * @param {(data: TData[]) => void} onDataChange - Optional callback when data is modified
 *
 * @example
 * ```tsx
 * <MasterDataGrid
 *   data={users}
 *   config={{
 *     schema: userSchema,
 *     enableSorting: true,
 *     enableFiltering: true,
 *     enablePagination: true,
 *     columnVisibility: { mode: "hide", columns: ["id"] }
 *   }}
 * />
 * ```
 */
export function MasterDataGrid<TData = Record<string, unknown>>({
  data,
  config,
  onDataChange,
}: MasterDataGridProps<TData>) {
  const {
    schema,
    columns: customColumns,
    t,
    enableSorting = true,
    enableFiltering = true,
    enableGrouping = true,
    enablePinning = true,
    enableResizing = true,
    enableColumnVisibility = true,
    enableRowSelection = false,
    enableVirtualization = false,
    enableExport = true,
    enablePagination = true,
    pageSize = 10,
    pageSizeOptions = [10, 20, 30, 40, 50],
    getRowId,
  } = config;

  // Create a config object with defaults applied
  // This ensures components receiving config get the correct default values
  const configWithDefaults: MasterDataGridConfig<TData> = {
    ...config,
    enableSorting,
    enableFiltering,
    enableGrouping,
    enablePinning,
    enableResizing,
    enableColumnVisibility,
    enableRowSelection,
    enableVirtualization,
    enableExport,
    enablePagination,
  };

  // Initialize table state with reducer for cleaner state transitions
  const {
    tableState,
    setSorting,
    setColumnFilters,
    setColumnVisibility,
    setRowSelection,
    setColumnPinning,
    setGrouping,
    setExpanded,
    setPagination,
    updateEditingRows,
    resetToDefaults,
  } = useTableStateReducer(configWithDefaults, pageSize);

  /** Global search filter state */
  const [globalFilter, setGlobalFilter] = useState("");

  /** Filter dialog state for column-specific filtering */
  const [filterDialogState, setFilterDialogState] = useState<FilterDialogState>(
    {
      open: false,
      columnId: null,
    }
  );

  /** Column settings dialog visibility state */
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);

  /**
   * Ref to access latest config without causing re-renders
   * Prevents column regeneration when config changes
   */
  const configRef = useRef(configWithDefaults);
  configRef.current = configWithDefaults;

  // ============================================================================
  // Editing Logic (Using Custom Hook)
  // ============================================================================

  const {
    editingRowsRef,
    startEditingRow,
    cancelEditingRow,
    saveEditingRow,
    updateCellValue,
  } = useEditing({
    data,
    getRowId,
    onDataChange,
    editingRows: tableState.editingRows || {},
    setEditingRows: updateEditingRows,
    editing: configWithDefaults.editing,
  });

  // ============================================================================
  // Filter Functions
  // ============================================================================

  /**
   * Global filter function for searching across all columns
   * Case-insensitive search that matches any column containing the search term
   */
  const globalFilterFn = useMemo<FilterFn<TData>>(
    () => (row, columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      return Object.values(row.original as Record<string, unknown>).some(
        (value) => {
          if (value == null) return false;
          return String(value).toLowerCase().includes(search);
        }
      );
    },
    []
  );

  // ============================================================================
  // Column Generation (Using Custom Hook)
  // ============================================================================

  const handleFilterClick = useCallback((columnId: string) => {
    setFilterDialogState({ open: true, columnId });
  }, []);

  const columns = useColumns({
    config: configWithDefaults,
    configRef,
    schema,
    customColumns,
    enableRowSelection,
    enableColumnVisibility,
    editingRowsRef,
    updateCellValue,
    getRowId,
    t,
    onFilterClick: handleFilterClick,
    startEditingRow,
    cancelEditingRow,
    saveEditingRow,
  });

  /**
   * Note: config.editing, config.rowActions, config.expansion are accessed via configRef
   * to prevent column regeneration on every config change. This is a performance optimization.
   */

  // Table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: tableState.sorting,
      columnFilters: tableState.columnFilters,
      columnVisibility: tableState.columnVisibility,
      rowSelection: tableState.rowSelection,
      columnPinning: tableState.columnPinning,
      grouping: tableState.grouping,
      expanded: tableState.expanded,
      pagination: tableState.pagination,
      globalFilter,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(tableState.sorting) : updater;
      setSorting(newSorting);
      configWithDefaults.onSortingChange?.(newSorting);
    },
    onColumnFiltersChange: (updater) => {
      const newFilters =
        typeof updater === "function"
          ? updater(tableState.columnFilters)
          : updater;
      setColumnFilters(newFilters);
      configWithDefaults.onFilteringChange?.(newFilters);
    },
    onColumnVisibilityChange: (updater) => {
      const newVisibility =
        typeof updater === "function"
          ? updater(tableState.columnVisibility)
          : updater;
      setColumnVisibility(newVisibility);
    },
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === "function"
          ? updater(tableState.rowSelection)
          : updater;
      setRowSelection(newSelection);

      // Notify selection change
      if (configWithDefaults.selection?.onSelectionChange) {
        const selectedRows = table
          .getSelectedRowModel()
          .rows.map((row) => row.original);
        configWithDefaults.selection.onSelectionChange(selectedRows);
      }
    },
    onColumnPinningChange: (updater) => {
      const newPinning =
        typeof updater === "function"
          ? updater(tableState.columnPinning)
          : updater;
      setColumnPinning(newPinning);
    },
    onGroupingChange: (updater) => {
      const newGrouping =
        typeof updater === "function" ? updater(tableState.grouping) : updater;
      setGrouping(newGrouping);
    },
    onExpandedChange: (updater) => {
      const newExpanded =
        typeof updater === "function" ? updater(tableState.expanded) : updater;
      setExpanded(newExpanded);
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function"
          ? updater(tableState.pagination)
          : updater;
      setPagination(newPagination);
      configWithDefaults.onPaginationChange?.(newPagination);
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    getGroupedRowModel: enableGrouping ? getGroupedRowModel() : undefined,
    getExpandedRowModel: getExpandedRowModel(),
    manualSorting: configWithDefaults.manualSorting,
    manualFiltering: configWithDefaults.manualFiltering,
    manualPagination:
      configWithDefaults.manualPagination ??
      configWithDefaults.rowCount != null,
    rowCount: configWithDefaults.rowCount,
    enableSorting,
    enableFilters: enableFiltering,
    enableGrouping,
    enableColumnPinning: enablePinning,
    enableColumnResizing: enableResizing,
    columnResizeMode: "onChange",
    enableHiding: enableColumnVisibility,
    enableRowSelection: Boolean(enableRowSelection),
    getRowId: getRowId ?? ((row, index) => String(index)),
    getRowCanExpand: configWithDefaults.expansion?.enabled
      ? () => true
      : undefined,
  });

  // ============================================================================
  // Derived State & Event Handlers
  // ============================================================================

  /** Selected row data */
  const selectedRows = useMemo(
    () => table.getSelectedRowModel().rows.map((row) => row.original),
    [table]
  );

  /**
   * Applies a filter to a specific column
   * @param filter - Filter configuration with column ID, operator, and value
   */
  const handleApplyFilter = useCallback(
    (filter: ColumnFilter) => {
      if (!filter.id) {
        logError("Cannot apply filter: filter.id is required");
        return;
      }
      const column = table.getColumn(filter.id);
      if (column) {
        column.setFilterValue(filter);
      } else {
        logWarning(`Column not found: ${filter.id}`);
      }
    },
    [table]
  );

  /** Clears the filter for the currently selected column */
  const handleClearFilter = useCallback(() => {
    if (filterDialogState.columnId) {
      const column = table.getColumn(filterDialogState.columnId);
      column?.setFilterValue(undefined);
    }
  }, [table, filterDialogState.columnId]);

  const handleExport = useCallback(
    (format: string) => {
      try {
        if (configWithDefaults.export?.customExport) {
          configWithDefaults.export.customExport(data, format);
        } else if (format === "csv") {
          exportToCSV(table, { filename: configWithDefaults.export?.filename });
        } else {
          logWarning(`Unsupported export format: ${format}`);
        }
      } catch (error) {
        logError("Export failed:", error);
      }
    },
    [table, data, configWithDefaults.export]
  );

  const handleReset = useCallback(() => {
    // Reset to initial config defaults
    resetToDefaults();

    // Reset table-specific state
    table.resetColumnOrder();
    table.resetColumnSizing();
    table.resetGlobalFilter();
    setGlobalFilter("");
  }, [table, resetToDefaults]);

  // ============================================================================
  // Render Logic
  // ============================================================================

  // Loading state
  if (configWithDefaults.loading) {
    return (
      <div className={cn("space-y-4", configWithDefaults.containerClassName)}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Empty state
  if (data.length === 0 && !configWithDefaults.loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-96",
          configWithDefaults.containerClassName
        )}
      >
        {configWithDefaults.emptyComponent || (
          <div className="text-center text-muted-foreground">
            {getTranslations("table.empty", t)}
          </div>
        )}
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 h-full",
        configWithDefaults.containerClassName
      )}
    >
      {/* Toolbar */}
      <Toolbar
        table={table}
        config={configWithDefaults}
        selectedRows={selectedRows}
        onExport={enableExport ? handleExport : undefined}
        onRefresh={configWithDefaults.onRefresh}
        onReset={handleReset}
        onOpenColumnSettings={() => setColumnSettingsOpen(true)}
      />

      {/* Table */}
      <div
        className={cn(
          "relative w-full border rounded-md overflow-hidden",
          configWithDefaults.className
        )}
        style={{ height: enableVirtualization ? "600px" : "auto" }}
      >
        {enableVirtualization ? (
          <Table
            className={cn(
              "border-separate border-spacing-0",
              configWithDefaults.tableClassName
            )}
          >
            <TableHeader
              className={cn(
                "sticky top-0 z-10 bg-background",
                configWithDefaults.headerClassName
              )}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={getPinningStyles(header)}
                      className={cn(
                        getPinningHeaderClassNames(header),
                        "border-b border-r"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <VirtualBody
              table={table}
              rows={rows}
              estimateSize={configWithDefaults.virtualization?.estimateSize}
              overscan={configWithDefaults.virtualization?.overscan}
              rowClassName={configWithDefaults.rowClassName}
              cellClassName={configWithDefaults.cellClassName}
              editingRows={tableState.editingRows}
              getRowId={getRowId}
              editingEnabled={configWithDefaults.editing?.enabled}
              expansionEnabled={configWithDefaults.expansion?.enabled}
              expansionRenderContent={
                configWithDefaults.expansion?.renderContent
              }
              expansionComponent={configWithDefaults.expansion?.component}
            />
          </Table>
        ) : (
          <Table
            className={cn(
              "border-spacing-0",
              configWithDefaults.tableClassName
            )}
            wrapperClassName="overflow-auto size-full"
          >
            <TableHeader
              className={cn(
                "sticky top-0 z-10 bg-white",
                configWithDefaults.headerClassName
              )}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={getPinningStyles(header)}
                      className={cn(
                        getPinningHeaderClassNames(header),
                        "has-[button]:px-0 not-last:border-r"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBodyRenderer
              table={table}
              rows={rows}
              rowClassName={configWithDefaults.rowClassName}
              cellClassName={configWithDefaults.cellClassName}
              editingRows={tableState.editingRows}
              getRowId={getRowId}
              editingEnabled={configWithDefaults.editing?.enabled}
              emptyMessage={getTranslations("table.noResults", t)}
              expansionEnabled={configWithDefaults.expansion?.enabled}
              expansionRenderContent={
                configWithDefaults.expansion?.renderContent
              }
              expansionComponent={configWithDefaults.expansion?.component}
              bodyClassName={configWithDefaults.bodyClassName}
            />
          </Table>
        )}
      </div>

      {/* Pagination */}
      {enablePagination && (
        <Pagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          syncWithUrl={true}
          t={t}
        />
      )}

      {/* Filter Dialog */}
      <FilterDialog
        open={filterDialogState.open}
        onOpenChange={(open) =>
          setFilterDialogState((prev) => ({ ...prev, open }))
        }
        column={
          filterDialogState.columnId
            ? table.getColumn(filterDialogState.columnId) || null
            : null
        }
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
        t={t}
      />

      {/* Column Settings Dialog */}
      <ColumnSettingsDialog
        open={columnSettingsOpen}
        onOpenChange={setColumnSettingsOpen}
        table={table}
        t={t}
      />
    </div>
  );
}
