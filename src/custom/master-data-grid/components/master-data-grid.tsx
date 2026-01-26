"use client";

import type { FilterFn } from "@tanstack/react-table";
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
import { useCallback, useMemo, useRef, useState } from "react";

import { Skeleton } from "../../../components/skeleton";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/table";
import { cn } from "../../../lib/utils";
import { useColumns } from "../hooks/use-columns";
import { useEditing } from "../hooks/use-editing";
import { useTableStateReducer } from "../hooks/use-table-state-reducer";
import type { MasterDataGridConfig, MasterDataGridProps } from "../types";
import { exportToCSV } from "../utils/export-utils";
import {
  getPinningHeaderClassNames,
  getPinningHeaderStyles,
} from "../utils/pinning-utils";
import { getTranslations } from "../utils/translation-utils";
import { ColumnSettingsDialog } from "./dialogs/column-settings-dialog";
import { ServerFilterContent } from "./filters/server-filter";
import { Pagination } from "./pagination";
import { TableBodyRenderer, VirtualBody } from "./table";
import { Toolbar } from "./toolbar";

const COMPONENT_NAME = "MasterDataGrid";

const logError = (message: string, data?: unknown) => {
  console.error(`[${COMPONENT_NAME}] ${message}`, data || "");
};

const logWarning = (message: string, data?: unknown) => {
  console.warn(`[${COMPONENT_NAME}] ${message}`, data || "");
};

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
    serverFilters,
    serverFilterLocation = "toolbar",
    pinning = {
      right: ["actions"],
    },
  } = config;

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
    serverFilters,
    serverFilterLocation,
    pinning,
  };

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

  const [globalFilter, setGlobalFilter] = useState("");

  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);

  const configRef = useRef(configWithDefaults);
  configRef.current = configWithDefaults;

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

  const globalFilterFn = useMemo<FilterFn<TData>>(
    () => (row, _, filterValue) => {
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
    startEditingRow,
    cancelEditingRow,
    saveEditingRow,
  });

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
    getRowId: getRowId ?? ((_, index) => String(index)),
    getRowCanExpand: configWithDefaults.expansion?.enabled
      ? () => true
      : undefined,
  });

  const selectedRows = useMemo(
    () => table.getSelectedRowModel().rows.map((row) => row.original),
    [table]
  );

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
    resetToDefaults();
    table.resetColumnOrder();
    table.resetColumnSizing();
    table.resetGlobalFilter();
    setGlobalFilter("");
  }, [table, resetToDefaults]);

  if (configWithDefaults.loading) {
    return (
      <div className={cn("space-y-4", configWithDefaults.containerClassName)}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (
    data.length === 0 &&
    !configWithDefaults.loading &&
    configWithDefaults.emptyComponent
  ) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-96",
          configWithDefaults.containerClassName
        )}
      >
        {configWithDefaults.emptyComponent}
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
      <Toolbar
        table={table}
        serverFilters={
          serverFilterLocation === "toolbar" ? serverFilters : undefined
        }
        config={configWithDefaults}
        selectedRows={selectedRows}
        onExport={enableExport ? handleExport : undefined}
        onRefresh={configWithDefaults.onRefresh}
        onReset={handleReset}
        onOpenColumnSettings={() => setColumnSettingsOpen(true)}
      />

      <div
        className={cn(
          "relative w-full border rounded-md overflow-hidden flex",
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
                      style={getPinningHeaderStyles(header)}
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
                      style={getPinningHeaderStyles(header)}
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
        {serverFilterLocation !== "toolbar" && (
          <div className="border-l hidden lg:block">
            <ServerFilterContent table={table} config={config} />
          </div>
        )}
      </div>
      {enablePagination && (
        <Pagination table={table} pageSizeOptions={pageSizeOptions} t={t} />
      )}
      <ColumnSettingsDialog
        open={columnSettingsOpen}
        onOpenChange={setColumnSettingsOpen}
        table={table}
        t={t}
      />
    </div>
  );
}
