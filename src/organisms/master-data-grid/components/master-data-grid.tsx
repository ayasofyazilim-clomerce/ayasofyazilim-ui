'use client';

import {
    ColumnDef,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getGroupedRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Save, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '../../../components/button';
import { Checkbox } from '../../../components/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../../components/dropdown-menu';
import { Skeleton } from '../../../components/skeleton';
import { Table, TableHead, TableHeader, TableRow } from '../../../components/table';
import { cn } from '../../../lib/utils';
import type {
    ColumnFilter,
    FilterDialogState,
    MasterDataGridProps,
    TableState
} from '../types';
import { generateColumnsFromSchema, mergeColumns } from '../utils/column-generator';
import { getPinningHeaderClassNames, getPinningStyles } from '../utils/pinning-utils';
import { getTranslations } from '../utils/translation-utils';
import { ColumnSettingsDialog } from './dialogs/column-settings-dialog';
import { FilterDialog } from './filters/filter-dialog';
import { TableBodyRenderer, VirtualBody } from './table';
import { Toolbar } from './toolbar';

/**
 * MasterDataGrid - Enterprise-grade data table component
 * 
 * Features:
 * - Schema-driven column generation
 * - Virtualization for 100k+ rows
 * - Advanced filtering with operators
 * - Sorting, grouping, aggregation
 * - Column pinning, resizing, reordering
 * - Row selection and actions
 * - Inline editing
 * - Multi-language support
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
        enableGrouping = false,
        enablePinning = true,
        enableResizing = true,
        enableColumnVisibility = true,
        enableRowSelection = false,
        enableVirtualization = true,
        enablePagination = false,
        pageSize = 50,
        getRowId,
    } = config;

    // State management
    const [tableState, setTableState] = useState<TableState>({
        sorting: [],
        columnFilters: [],
        columnVisibility: {},
        rowSelection: {},
        columnPinning: { left: [], right: [] },
        grouping: config.grouping?.groupBy || [],
        expanded: config.grouping?.expanded || {},
        pagination: {
            pageIndex: 0,
            pageSize: pageSize,
        },
        editingRows: {},
    });

    const [globalFilter, setGlobalFilter] = useState('');

    const [filterDialogState, setFilterDialogState] = useState<FilterDialogState>({
        open: false,
        columnId: null,
    });

    const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);

    // Use ref to access latest editing state without causing re-renders
    const editingRowsRef = useRef<Record<string, Record<string, unknown>>>({});
    editingRowsRef.current = tableState.editingRows || {};

    // Use refs to access latest config without causing re-renders
    const configRef = useRef(config);
    configRef.current = config;

    // Editing handlers
    const startEditingRow = useCallback((rowId: string, row: TData) => {
        if (configRef.current.editing?.isRowEditable && !configRef.current.editing.isRowEditable(row)) {
            return;
        }
        setTableState(prev => ({
            ...prev,
            editingRows: { ...prev.editingRows, [rowId]: {} },
        }));
    }, []);

    const cancelEditingRow = useCallback((rowId: string, row: TData) => {
        setTableState(prev => {
            const { [rowId]: removed, ...rest } = prev.editingRows || {};
            return { ...prev, editingRows: rest };
        });
        configRef.current.editing?.onRowCancel?.(row);
    }, []);

    const saveEditingRow = useCallback(async (rowId: string, row: TData) => {
        const changes = editingRowsRef.current[rowId] || {};
        const typedChanges = changes as Partial<TData>;

        if (configRef.current.editing?.onRowSave) {
            await configRef.current.editing.onRowSave(row, typedChanges);
        }

        // Apply changes to data
        if (onDataChange && Object.keys(changes).length > 0) {
            const updatedData = data.map(item => {
                const itemId = getRowId ? getRowId(item, data.indexOf(item)) : String(data.indexOf(item));
                return itemId === rowId ? { ...item, ...typedChanges } : item;
            });
            onDataChange(updatedData);
        }

        // Clear editing state
        setTableState(prev => {
            const { [rowId]: removed, ...rest } = prev.editingRows || {};
            return { ...prev, editingRows: rest };
        });
    }, [data, onDataChange, getRowId]);

    const updateCellValue = useCallback((rowId: string, columnId: string, value: unknown) => {
        setTableState(prev => ({
            ...prev,
            editingRows: {
                ...prev.editingRows,
                [rowId]: {
                    ...prev.editingRows?.[rowId],
                    [columnId]: value,
                },
            },
        }));
    }, []);

    // Custom global filter function
    const globalFilterFn: FilterFn<TData> = (row, columnId, filterValue) => {
        const search = String(filterValue).toLowerCase();

        // Search across all visible columns
        return Object.values(row.original as Record<string, unknown>).some((value) => {
            if (value == null) return false;
            return String(value).toLowerCase().includes(search);
        });
    };

    // Generate columns from schema and merge with custom columns
    const columns = useMemo<ColumnDef<TData>[]>(() => {
        const handleFilterClick = (columnId: string) => {
            setFilterDialogState({ open: true, columnId });
        };

        const editingContext = configRef.current.editing?.enabled ? {
            get editingRows() {
                return editingRowsRef.current;
            },
            onCellUpdate: updateCellValue,
            getRowId: getRowId || ((row: TData, index: number) => String(index)),
        } : undefined;

        const generatedColumns = schema
            ? generateColumnsFromSchema<TData>(
                schema,
                configRef.current.localization,
                t,
                handleFilterClick,
                editingContext,
                configRef.current.cellClassName,
                configRef.current.dateOptions,
                configRef.current.customRenderers,
                configRef.current.editing?.errorDisplayMode,
                enableColumnVisibility,
            )
            : [];

        // Create a simpler context for merging (no onCellUpdate needed)
        const mergeContext = editingContext ? {
            get editingRows() {
                return editingRowsRef.current;
            },
            getRowId: editingContext.getRowId,
        } : undefined;

        const merged = mergeColumns<TData>(generatedColumns, customColumns, mergeContext, enableColumnVisibility);

        const finalColumns: ColumnDef<TData>[] = [];

        // Add expander column if enabled
        if (configRef.current.expansion?.enabled) {
            finalColumns.push({
                id: 'expander',
                header: () => null,
                cell: ({ row }) => {
                    return row.getCanExpand() ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={row.getToggleExpandedHandler()}
                            className="p-0 h-6 w-6"
                        >
                            {row.getIsExpanded() ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                    ) : null;
                },
                enableSorting: false,
                enableHiding: false,
            });
        }

        // Add selection column if enabled
        if (enableRowSelection) {
            finalColumns.push({
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
                        aria-label={getTranslations('selection.selectAll', t)}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={value => row.toggleSelected(!!value)}
                        aria-label={getTranslations('selection.selectRow', t)}
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            });
        }

        // Add data columns
        finalColumns.push(...merged);

        // Add edit/save/cancel column if editing is enabled
        if (configRef.current.editing?.enabled && configRef.current.editing.mode === 'row') {
            finalColumns.push({
                id: 'edit-actions',
                header: () => <div className="text-right">{getTranslations('table.edit', t)}</div>,
                cell: ({ row }) => {
                    const rowData = row.original;
                    const rowId = getRowId ? getRowId(rowData, row.index) : String(row.index);
                    const isEditing = editingRowsRef.current[rowId] !== undefined;
                    const isEditable = configRef.current.editing?.isRowEditable?.(rowData) ?? true;

                    if (!isEditable) return null;

                    return (
                        <div className="flex justify-end gap-1 px-2">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            saveEditingRow(rowId, rowData);
                                        }}
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                    >
                                        <Save className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            cancelEditingRow(rowId, rowData);
                                        }}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon-xs"

                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingRow(rowId, rowData);
                                    }}
                                >
                                    <Pencil className="size-4" />
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
        if (configRef.current.rowActions && configRef.current.rowActions.length > 0) {
            finalColumns.push({
                id: 'actions',
                header: () => <div className="text-right">Actions</div>,
                cell: ({ row }) => {
                    const rowData = row.original;
                    const visibleActions = configRef.current.rowActions!.filter(action => {
                        const hidden = typeof action.hidden === 'function'
                            ? action.hidden(rowData)
                            : action.hidden;
                        return !hidden;
                    });

                    if (visibleActions.length === 0) return null;

                    return (
                        <div className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {visibleActions.map(action => {
                                        const disabled = typeof action.disabled === 'function'
                                            ? action.disabled(rowData)
                                            : action.disabled;
                                        const label = typeof action.label === 'function'
                                            ? action.label(rowData)
                                            : action.label;
                                        const Icon = action.icon;

                                        return (
                                            <DropdownMenuItem
                                                key={action.id}
                                                disabled={disabled}
                                                onClick={(e) => action.onClick?.(rowData, e)}
                                                className={action.className}
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
    }, [schema, customColumns, t, enableRowSelection, updateCellValue, saveEditingRow, cancelEditingRow, startEditingRow, getRowId]);
    // Note: tableState.editingRows, config.editing, config.rowActions, config.expansion are intentionally NOT in deps
    // They are accessed via refs to prevent column recreation on every state change

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
        onSortingChange: updater => {
            const newSorting = typeof updater === 'function'
                ? updater(tableState.sorting)
                : updater;
            setTableState(prev => ({ ...prev, sorting: newSorting }));
            config.onSortingChange?.(newSorting);
        },
        onColumnFiltersChange: updater => {
            const newFilters = typeof updater === 'function'
                ? updater(tableState.columnFilters)
                : updater;
            setTableState(prev => ({ ...prev, columnFilters: newFilters }));
            config.onFilteringChange?.(newFilters);
        },
        onColumnVisibilityChange: updater => {
            const newVisibility = typeof updater === 'function'
                ? updater(tableState.columnVisibility)
                : updater;
            setTableState(prev => ({ ...prev, columnVisibility: newVisibility }));
        },
        onRowSelectionChange: updater => {
            const newSelection = typeof updater === 'function'
                ? updater(tableState.rowSelection)
                : updater;
            setTableState(prev => ({ ...prev, rowSelection: newSelection }));

            // Notify selection change
            if (config.selection?.onSelectionChange) {
                const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
                config.selection.onSelectionChange(selectedRows);
            }
        },
        onColumnPinningChange: updater => {
            const newPinning = typeof updater === 'function'
                ? updater(tableState.columnPinning)
                : updater;
            setTableState(prev => ({ ...prev, columnPinning: newPinning }));
        },
        onGroupingChange: updater => {
            const newGrouping = typeof updater === 'function'
                ? updater(tableState.grouping)
                : updater;
            setTableState(prev => ({ ...prev, grouping: newGrouping }));
        },
        onExpandedChange: updater => {
            const newExpanded = typeof updater === 'function'
                ? updater(tableState.expanded)
                : updater;
            setTableState(prev => ({ ...prev, expanded: newExpanded }));
        },
        onPaginationChange: updater => {
            const newPagination = typeof updater === 'function'
                ? updater(tableState.pagination)
                : updater;
            setTableState(prev => ({ ...prev, pagination: newPagination }));
            config.onPaginationChange?.(newPagination);
        },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: globalFilterFn,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
        getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
        getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
        getGroupedRowModel: enableGrouping ? getGroupedRowModel() : undefined,
        getExpandedRowModel: getExpandedRowModel(),
        manualSorting: config.manualSorting,
        manualFiltering: config.manualFiltering,
        manualPagination: config.manualPagination,
        enableSorting,
        enableFilters: enableFiltering,
        enableGrouping,
        enableColumnPinning: enablePinning,
        enableColumnResizing: enableResizing,
        enableHiding: enableColumnVisibility,
        enableRowSelection: enableRowSelection ? true : false,
        getRowId: getRowId || ((row, index) => String(index)),
        getRowCanExpand: config.expansion?.enabled ? () => true : undefined,
    });

    // Selected rows
    const selectedRows = useMemo(
        () => table.getSelectedRowModel().rows.map(row => row.original),
        [table.getSelectedRowModel().rows]
    );

    // Filter handlers
    const handleApplyFilter = useCallback((filter: ColumnFilter) => {
        const column = table.getColumn(filter.id);
        if (column) {
            column.setFilterValue(filter);
        }
    }, [table]);

    const handleClearFilter = useCallback(() => {
        if (filterDialogState.columnId) {
            const column = table.getColumn(filterDialogState.columnId);
            column?.setFilterValue(undefined);
        }
    }, [table, filterDialogState.columnId]);

    // Export handler
    const handleExport = useCallback((format: string) => {
        if (config.export?.customExport) {
            config.export.customExport(data, format);
        } else {
            // Default CSV export
            const rows = table.getFilteredRowModel().rows;
            const headers = table.getVisibleLeafColumns().map(col => col.id);

            const csv = [
                headers.join(','),
                ...rows.map(row =>
                    headers.map(header => {
                        const cell = row.getValue(header);
                        return typeof cell === 'string' && cell.includes(',')
                            ? `"${cell}"`
                            : String(cell ?? '');
                    }).join(',')
                ),
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${config.export?.filename || 'export'}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }, [table, data, config.export]);

    // Loading state
    if (config.loading) {
        return (
            <div className={cn('space-y-4', config.containerClassName)}>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    // Empty state
    if (data.length === 0 && !config.loading) {
        return (
            <div className={cn('flex items-center justify-center h-96', config.containerClassName)}>
                {config.emptyComponent || (
                    <div className="text-center text-muted-foreground">
                        {config.emptyMessage || getTranslations('table.empty', t)}
                    </div>
                )}
            </div>
        );
    }

    const rows = table.getRowModel().rows;

    return (
        <div className={cn('flex flex-col gap-2', config.containerClassName)}>
            {/* Toolbar */}
            <Toolbar
                table={table}
                config={config}
                selectedRows={selectedRows}
                onExport={config.enableExport ? handleExport : undefined}
                onRefresh={config.onRefresh}
                onOpenColumnSettings={() => setColumnSettingsOpen(true)}
            />

            {/* Table */}
            <div className={cn('relative flex w-full flex-col overflow-hidden border rounded-md', config.className)}>
                {enableVirtualization ? (
                    <div className="relative">
                        <Table className={cn('border-separate border-spacing-0', config.tableClassName)}>
                            <TableHeader className={cn('sticky top-0 z-10 bg-background', config.headerClassName)}>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <TableHead
                                                key={header.id}
                                                style={getPinningStyles(header)}
                                                className={cn(getPinningHeaderClassNames(header))}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                        </Table>

                        <VirtualBody
                            table={table}
                            rows={rows}
                            estimateSize={config.virtualization?.estimateSize}
                            overscan={config.virtualization?.overscan}
                            rowClassName={config.rowClassName}
                            cellClassName={config.cellClassName}
                            editingRows={tableState.editingRows}
                            getRowId={getRowId}
                            editingEnabled={config.editing?.enabled}
                        />
                    </div>
                ) : (
                    <Table className={cn('border-spacing-0', config.tableClassName)}>
                        <TableHeader className={cn(config.headerClassName)}>
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
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
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBodyRenderer
                            table={table}
                            rows={rows}
                            rowClassName={config.rowClassName}
                            cellClassName={config.cellClassName}
                            editingRows={tableState.editingRows}
                            getRowId={getRowId}
                            editingEnabled={config.editing?.enabled}
                            emptyMessage={config.emptyMessage || getTranslations('table.noResults', t)}
                            expansionEnabled={config.expansion?.enabled}
                            expansionRenderContent={config.expansion?.renderContent}
                            expansionComponent={config.expansion?.component}
                            bodyClassName={config.bodyClassName}
                        />
                    </Table>
                )}
            </div>

            {/* Pagination */}
            {enablePagination && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{' '}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            className="border rounded p-1"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </button>
                        <button
                            className="border rounded p-1"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Dialog */}
            <FilterDialog
                open={filterDialogState.open}
                onOpenChange={open => setFilterDialogState(prev => ({ ...prev, open }))}
                column={filterDialogState.columnId ? (table.getColumn(filterDialogState.columnId) || null) : null}
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
