"use client";

import type { FilterFn } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Skeleton } from "../../../components/skeleton";
import { Table } from "../../../components/table";
import { cn } from "../../../lib/utils";
import {
  LocalServerFiltersContext,
  type LocalServerFilters,
} from "../context/local-server-filters";
import { useMasterDataGridResources } from "../context/resources";
import { useColumns } from "../hooks/use-columns";
import { useDelayedFlag } from "../hooks/use-delayed-flag";
import { useEditing } from "../hooks/use-editing";
import { useGridNavigation } from "../hooks/use-grid-navigation";
import { useTableStateReducer } from "../hooks/use-table-state-reducer";
import type { MasterDataGridConfig, MasterDataGridProps } from "../types";
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
} from "../utils/export-utils";
import { paginationFromUrl } from "../utils/grid-url-params";
import { getTranslations } from "../utils/translation-utils";
import { readFilterValues, visibleFilters } from "../utils/server-filter-utils";
import {
  isBlankPrefixUrlState,
  isPrefixUrlState,
  scopedKey,
} from "../utils/url-scope";
import { ServerFilterBar } from "./filters/server-filter-bar";
import { ServerFilterContent } from "./filters/server-filter";
import { Pagination } from "./pagination";
import { GridFooter, GridHeader, TableBodyRenderer, VirtualBody } from "./table";
import { Toolbar } from "./toolbar";

const COMPONENT_NAME = "MasterDataGrid";

const logError = (message: string, data?: unknown) => {
  console.error(`[${COMPONENT_NAME}] ${message}`, data || "");
};

const logWarning = (message: string, data?: unknown) => {
  console.warn(`[${COMPONENT_NAME}] ${message}`, data || "");
};

type GridPagination = { pageIndex: number; pageSize: number };

/** The URL a prefix-mode grid reads its page from and writes it to. */
interface UrlScope {
  prefix: string;
  searchParams: URLSearchParams;
  pathname: string;
}

const samePage = (a: GridPagination, b: GridPagination) =>
  a.pageIndex === b.pageIndex && a.pageSize === b.pageSize;

export function MasterDataGrid<TData = Record<string, unknown>>(
  props: MasterDataGridProps<TData>
) {
  const { urlState } = props.config;
  // `{ prefix: "" }` would write the un-prefixed keys default grids use, so it
  // runs as a default grid (see isPrefixUrlState); say so while developing.
  const blankPrefix = isBlankPrefixUrlState(urlState);
  useEffect(() => {
    // NODE_ENV is inlined by the app's bundler, not read from turbo's env.
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    if (blankPrefix && process.env.NODE_ENV !== "production") {
      logWarning(
        "urlState.prefix is empty, so this grid runs in default mode (un-prefixed URL keys). Pass a non-empty prefix, or leave urlState out."
      );
    }
  }, [blankPrefix]);
  if (isPrefixUrlState(urlState)) {
    return <PrefixedMasterDataGrid {...props} prefix={urlState.prefix} />;
  }
  return <MasterDataGridView {...props} />;
}

// A prefix-mode grid takes its page from the URL on every render. The URL is
// read here rather than in the grid itself, so default-mode grids call no extra
// useSearchParams (a grid without pagination or server filters calls none).
function PrefixedMasterDataGrid<TData>({
  prefix,
  ...props
}: MasterDataGridProps<TData> & { prefix: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  return (
    <MasterDataGridView
      {...props}
      urlScope={{ prefix, searchParams, pathname }}
    />
  );
}

function MasterDataGridView<TData = Record<string, unknown>>({
  data,
  config,
  onDataChange,
  urlScope,
}: MasterDataGridProps<TData> & { urlScope?: UrlScope }) {
  const {
    schema,
    columns: customColumns,
    t: tProp,
    enableSearch = true,
    enableSorting = true,
    enableFiltering = true,
    enablePinning = true,
    enableResizing = true,
    enableColumnVisibility = true,
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

  // A grid may be given resources directly; otherwise take them from the provider.
  const contextResources = useMasterDataGridResources();
  const t = tProp ?? contextResources;

  const enableGrouping = config.grouping?.enabled ?? false;

  const configWithDefaults: MasterDataGridConfig<TData> = {
    ...config,
    t,
    enableSearch,
    enableSorting,
    enableFiltering,
    enablePinning,
    enableResizing,
    enableColumnVisibility,
    enableVirtualization,
    enableExport,
    enablePagination,
    serverFilters,
    serverFilterLocation,
    pinning,
  };

  const isServerFiltered =
    serverFilterLocation === "toolbar" &&
    visibleFilters(serverFilters).length > 0;

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

  const { navigate, isNavigating } = useGridNavigation();

  // Who owns the page:
  // - default: table state, mirrored to `skipCount` by Pagination (today's).
  // - prefix: the URL. Paging writes the URL, and the page is read back from
  //   it on every render, so Back/Forward and links move the grid, and a filter
  //   push that drops `<prefix>.skipCount` lands on page one with nothing to
  //   undo it. Until a paging navigation lands, the page it asked for is shown,
  //   by the filter bar's pendingPush rule: once the URL moves at all, the URL
  //   wins, so a different navigation landing first is never overruled.
  // - "none": table state; changes go to onPaginationChange.
  const isLocal = configWithDefaults.urlState === "none";
  const isDefaultUrl = !urlScope && !isLocal;
  const urlPagination = urlScope
    ? paginationFromUrl(urlScope.searchParams, urlScope.prefix, pageSize)
    : undefined;
  const urlQuery = urlScope ? urlScope.searchParams.toString() : "";
  const [pendingPage, setPendingPage] = useState<{
    from: string;
    to: GridPagination;
  } | null>(null);
  useEffect(() => {
    if (pendingPage && pendingPage.from !== urlQuery) setPendingPage(null);
  }, [pendingPage, urlQuery]);
  const currentPagination: GridPagination = urlPagination
    ? pendingPage && pendingPage.from === urlQuery
      ? pendingPage.to
      : urlPagination
    : tableState.pagination;

  const writeUrlPage = (next: GridPagination) => {
    if (!urlScope) return;
    const params = new URLSearchParams(urlScope.searchParams.toString());
    const skipKey = scopedKey("skipCount", urlScope.prefix);
    const maxKey = scopedKey("maxResultCount", urlScope.prefix);
    const skipCount = next.pageIndex * next.pageSize;
    // The grid's own pageSize stays out of the URL, as getGridUrlParams expects.
    if (next.pageSize === pageSize) params.delete(maxKey);
    else params.set(maxKey, next.pageSize.toString());
    if (skipCount === 0) params.delete(skipKey);
    else params.set(skipKey, skipCount.toString());
    setPendingPage({ from: urlQuery, to: next });
    navigate(`${urlScope.pathname}?${params.toString()}`, { replace: true });
  };

  // Moves a prefix or "none" grid to `next` and reports it (filter commits and
  // the toolbar Reset); a default grid never calls this.
  const goToPage = (next: GridPagination) => {
    if (samePage(next, currentPagination)) return;
    if (urlScope) writeUrlPage(next);
    else setPagination(next);
    configWithDefaults.onPaginationChange?.(next);
  };

  // "none" mode keeps its applied server filters here, where they outlive the
  // skeleton and empty states, for every filter UI below to share.
  const [localFilterQuery, setLocalFilterQuery] = useState("");
  const localServerFilters: LocalServerFilters | null = isLocal
    ? {
        query: localFilterQuery,
        commit: (next) => {
          setLocalFilterQuery(next.toString());
          configWithDefaults.onServerFiltersChange?.(
            readFilterValues(serverFilters ?? [], next)
          );
          goToPage({ pageIndex: 0, pageSize: currentPagination.pageSize });
        },
      }
    : null;
  const showPending = useDelayedFlag(
    isNavigating || Boolean(configWithDefaults.loading),
    150
  );

  const [globalFilter, setGlobalFilter] = useState("");

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

  const enableRowSelection = Boolean(config.selection?.enabled);

  const columns = useColumns({
    config: configWithDefaults,
    configRef,
    schema,
    customColumns,
    enableColumnVisibility,
    editingRowsRef,
    updateCellValue,
    getRowId,
    t,
    startEditingRow,
    cancelEditingRow,
    saveEditingRow,
  });

  const controlledRowSelection = config.selection?.selectedIds
    ? Object.fromEntries(config.selection.selectedIds.map((id) => [id, true]))
    : undefined;
  const rowSelectionState = controlledRowSelection ?? tableState.rowSelection;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: tableState.sorting,
      columnFilters: tableState.columnFilters,
      columnVisibility: tableState.columnVisibility,
      rowSelection: rowSelectionState,
      columnPinning: tableState.columnPinning,
      grouping: tableState.grouping,
      expanded: tableState.expanded,
      pagination: currentPagination,
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
        typeof updater === "function" ? updater(rowSelectionState) : updater;

      // Only update internal state when uncontrolled
      if (!controlledRowSelection) {
        setRowSelection(newSelection);
      }

      if (configWithDefaults.selection?.onSelectionChange) {
        const selectedRows = table
          .getRowModel()
          .rows.filter((row) => newSelection[row.id])
          .map((row) => row.original);
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
        typeof updater === "function" ? updater(currentPagination) : updater;
      if (!urlScope) {
        setPagination(newPagination);
      } else if (!samePage(newPagination, currentPagination)) {
        writeUrlPage(newPagination);
      }
      configWithDefaults.onPaginationChange?.(newPagination);
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel:
      enableFiltering || enableSearch ? getFilteredRowModel() : undefined,
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
    enableColumnFilters: enableFiltering,
    enableGlobalFilter: enableSearch,
    enableGrouping,
    enableColumnPinning: enablePinning,
    enableColumnResizing: enableResizing,
    columnResizeMode: "onChange",
    enableHiding: enableColumnVisibility,
    enableRowSelection: configWithDefaults.selection?.rowSelectable
      ? (row) => configWithDefaults.selection!.rowSelectable!(row.original)
      : enableRowSelection,
    enableMultiRowSelection: configWithDefaults.selection?.mode !== "single",
    getRowId: getRowId ?? ((_, index) => String(index)),
    getRowCanExpand: configWithDefaults.expansion?.enabled
      ? () => true
      : undefined,
    autoResetExpanded: false,
  });

  const selectedRows = useMemo(
    () => table.getSelectedRowModel().rows.map((row) => row.original),
    // rowSelectionState must be included so this recomputes whenever selection changes.
    // `table` is a stable reference and alone is not sufficient as a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, rowSelectionState]
  );

  const handleExport = useCallback(
    async (format: string) => {
      try {
        const exportConfig = configWithDefaults.export;
        const options = {
          filename: exportConfig?.filename,
          t: configWithDefaults.t,
        };
        if (exportConfig?.customExport) {
          await exportConfig.customExport(data, format);
        } else if (format === "csv") {
          exportToCSV(table, options);
        } else if (format === "excel") {
          await exportToExcel(table, options);
        } else if (format === "json") {
          exportToJSON(table, options);
        } else {
          logWarning(`Unsupported export format: ${format}`);
        }
      } catch (error) {
        logError("Export failed:", error);
      }
    },
    [table, data, configWithDefaults.export, configWithDefaults.t]
  );

  const handleReset = useCallback(() => {
    resetToDefaults();
    table.resetColumnOrder();
    table.resetColumnSizing();
    table.resetGlobalFilter();
    setGlobalFilter("");
  }, [table, resetToDefaults]);
  // A default grid's reset page reaches the URL through Pagination's effect.
  // The other modes keep the page outside table state, so move and report it.
  const onReset = isDefaultUrl
    ? handleReset
    : () => {
        handleReset();
        goToPage({ pageIndex: 0, pageSize });
      };
  const groupRowLookup = useMemo(() => {
    const labelField = configWithDefaults.grouping?.groupLabelField;
    if (!labelField || !enableGrouping) return undefined;
    const map = new Map<string, unknown>();
    data.forEach((item) => {
      const id = (item as Record<string, unknown>)["id"];
      if (id != null)
        map.set(String(id), (item as Record<string, unknown>)[labelField]);
    });
    return map;
  }, [data, configWithDefaults.grouping?.groupLabelField, enableGrouping]);
  if (configWithDefaults.loading && data.length === 0) {
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
    <LocalServerFiltersContext.Provider value={localServerFilters}>
      <div
        className={cn(
          "flex flex-col gap-2",
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
          onReset={onReset}
          isServerFiltered={isServerFiltered}
        />

        {isServerFiltered && (
          <ServerFilterBar config={configWithDefaults} navigate={navigate} />
        )}

        <div
          aria-busy={showPending || undefined}
          className={cn(
            "relative w-full border rounded-md overflow-hidden flex",
            showPending &&
              !configWithDefaults.loadingComponent &&
              "**:data-[slot=table-body]:opacity-45 **:data-[slot=table-body]:pointer-events-none **:data-[slot=table-body]:transition-opacity",
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
              <GridHeader
                table={table}
                mode="virtual"
                headerClassName={configWithDefaults.headerClassName}
              />
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
              />
              <GridFooter table={table} />
            </Table>
          ) : (
            <Table
              className={cn(
                "border-spacing-0",
                configWithDefaults.tableClassName
              )}
              wrapperClassName="overflow-auto size-full"
            >
              <GridHeader
                table={table}
                mode="normal"
                headerClassName={configWithDefaults.headerClassName}
              />
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
                bodyClassName={configWithDefaults.bodyClassName}
                hideNullGroups={configWithDefaults.grouping?.hideNullGroups}
                groupRowLookup={groupRowLookup}
                groupFallbackRenderer={
                  configWithDefaults.grouping?.groupFallbackRenderer
                }
                hideGroupParentRows={
                  configWithDefaults.grouping?.hideGroupParentRows
                }
              />
              <GridFooter table={table} />
            </Table>
          )}
          {serverFilterLocation !== "toolbar" && (
            <div className="border-l hidden lg:block w-full max-w-xs">
              <ServerFilterContent table={table} config={configWithDefaults} />
            </div>
          )}
          {showPending && configWithDefaults.loadingComponent && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80">
              {configWithDefaults.loadingComponent}
            </div>
          )}
        </div>
        {enablePagination && (
          <Pagination
            table={table}
            navigate={navigate}
            pending={showPending && !configWithDefaults.loadingComponent}
            pageSizeOptions={pageSizeOptions}
            t={t}
            localization={configWithDefaults.localization}
            unfilteredRowCount={configWithDefaults.unfilteredRowCount}
            syncsUrl={isDefaultUrl}
          />
        )}
      </div>
    </LocalServerFiltersContext.Provider>
  );
}
