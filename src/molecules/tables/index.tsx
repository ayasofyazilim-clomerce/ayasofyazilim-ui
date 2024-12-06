'use client';

import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { columnsGenerator } from './columnsGenerator';
import { ColumnFilter } from './filter-column';
import { DataTableProps, FilterColumnResult, TableAction } from './types';
import TableFooter from './table-footer';
import { SkeletonCell } from './helper-components';
import TableToolbar from './table-toolbar';

/**
 * Renders a data table with customizable columns, sorting, filtering, and selection capabilities.
 * The table can display data in either a custom format defined by the user or automatically generate columns based on provided data.
 * It supports loading states, custom actions, and can be filtered by a specific field.
 *
 * @param {DataTableProps<TData>} props - The properties for configuring the DataTable component.
 * @param {ColumnsType} props.columnsData - Configuration for the table columns. Can be either custom-defined columns or automatically generated based on data.
 * @param {TData[]} props.data - The data to be displayed in the table.
 * @param {TableAction} [props.action] - Optional. Configuration for an action that can be performed on the table data, such as adding a new row.
 * @param {boolean} [props.isLoading] - Optional. Indicates whether the table is in a loading state. Defaults to false.
 *
 * @returns {ReactElement} The rendered data table component.
 *
 * @template TData - The type of the data objects that will be displayed in the table.
 * @template TValue - The type of the values within each data object. This is used when defining custom columns.
 *
 * @example
 * // Example usage of DataTable with auto-generated columns
 * const usersData = [{ id: 1, name: 'John Doe', role: 'Admin' }];
 * const columnsConfig = {
 *   type: 'Auto',
 *   data: {
 *     autoFormArgs: {},
 *     callback: () => {},
 *     excludeList: ['id'],
 *     onDelete: () => {},
 *     onEdit: () => {},
 *     tableType: 'UserTable',
 *   },
 * };
 *
 * <DataTable
 *   columnsData={columnsConfig}
 *   data={usersData}
 * />
 */
export default function DataTable<TData, TValue>(
  inputProps: DataTableProps<TData>
) {
  const {
    columnsData,
    data,
    action,
    isLoading,
    rowCount,
    fetchRequest,
    renderSubComponent,
    onDataUpdate,
    detailedFilter,
    classNames,
  } = inputProps;
  const [tableData, setTableData] = useState<TData[]>(data || []);
  const isMultipleActionProvided = Array.isArray(action);
  const [isOpen, setIsOpen] = useState(false);
  let defaultAction: TableAction | undefined;
  if (action) {
    defaultAction = isMultipleActionProvided ? action[0] : action;
  }
  const [activeAction, setActiveAction] = React.useState<
    TableAction<TData> | undefined
  >(defaultAction);
  const [triggerData, setTriggerData] = useState<any>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [filteredColumns, setFilteredColumns] = useState<ColumnFilter[]>(() => {
    if (detailedFilter) {
      return detailedFilter.filter((i) => i.value);
    }
    return [];
  });

  const getRowId = useCallback(
    (row: TData) => (row as TData & { id: string }).id,
    []
  );

  useEffect(() => {
    if (isLoading) {
      setTableData(Array(6).fill({}) as TData[]);
    } else {
      setTableData(data);
    }
  }, [isLoading, data]);

  useEffect(() => {
    onDataUpdate?.(tableData);
    setIsOpen(false);
  }, [tableData, onDataUpdate]);

  let columns: ColumnDef<any, any>[] = [];
  if (columnsData.type === 'Auto') {
    columns = columnsGenerator<TData>({
      columnsData,
      data: columnsData.data,
      setActiveAction,
      setTriggerData,
      setIsOpen,
    });
  } else {
    columns = columnsData.data.columns as ColumnDef<TData, TValue>[];
  }
  if (isLoading) {
    columns = columns.map((column) => ({
      ...column,
      cell: SkeletonCell,
    }));
  }

  const table = useReactTable({
    data: tableData,
    columns,
    getRowId: (row) => getRowId(row),
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: typeof fetchRequest === 'function',
    rowCount: rowCount || tableData.length,
    getSortedRowModel: getSortedRowModel(),
    manualFiltering: typeof fetchRequest === 'function',
    getRowCanExpand: () => !!renderSubComponent,
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (row) => {
      if (isLoading) return;
      setRowSelection(row);
    },
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnOrder:
        columnsData.type === 'Auto'
          ? (columnsData.data.positions as string[])
          : [],
    },
    meta: {
      removeRow: (rowIndex) => {
        setTableData((old) => old.filter((_row, index) => index !== rowIndex));
        table.resetRowSelection();
      },
      updateData: (rowIndex, columnId, value) => {
        setTableData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...row,
                [columnId]: value,
              };
            }
            return row;
          })
        );
      },
      addRow: () => {},
    },
  });

  const selectedRows = table?.getSelectedRowModel()?.rows || [];

  useEffect(() => {
    const filter: FilterColumnResult = {};
    filteredColumns.forEach((column: ColumnFilter) => {
      if (column.type === 'select-multiple' || column.type === 'select-async') {
        filter[column.name] = column.value.split(',').filter((i) => i);
      } else {
        filter[column.name] = column.value;
      }
    });

    fetchRequest?.({
      page: table.getState().pagination.pageIndex,
      filter,
      pageSize: table.getState().pagination.pageSize,
    });
  }, [
    table.getState().pagination.pageIndex,
    filteredColumns,
    table.getState().pagination.pageSize,
  ]);

  return (
    <div className="flex flex-row">
      {inputProps.filterType === 'Column' && (
        <TableToolbar<TData>
          inputProps={inputProps}
          activeAction={activeAction}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          triggerData={triggerData}
          defaultAction={defaultAction}
          table={table}
          isMultipleActionProvided={isMultipleActionProvided}
          filteredColumns={filteredColumns}
          setTriggerData={setTriggerData}
          setActiveAction={setActiveAction}
          detailedFilter={detailedFilter}
          setFilteredColumns={setFilteredColumns}
        />
      )}
      <div className={cn('flex flex-col p-4', classNames?.container)}>
        {inputProps.filterType !== 'Column' && (
          <TableToolbar<TData>
            inputProps={inputProps}
            activeAction={activeAction}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            triggerData={triggerData}
            defaultAction={defaultAction}
            table={table}
            isMultipleActionProvided={isMultipleActionProvided}
            filteredColumns={filteredColumns}
            setTriggerData={setTriggerData}
            setActiveAction={setActiveAction}
            detailedFilter={detailedFilter}
            setFilteredColumns={setFilteredColumns}
          />
        )}
        <div className={cn('overflow-auto', classNames?.table?.wrapper)}>
          <Table
            wrapperClassName={cn(
              'flex-1 border rounded-md',
              classNames?.table?.container
            )}
          >
            <TableHeader
              className={cn(
                'sticky top-0 bg-slate-100 z-10',
                classNames?.table?.header
              )}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="whitespace-nowrap">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      <div>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className={cn(classNames?.table?.body)}>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      className="whitespace-nowrap"
                    >
                      {row.getVisibleCells().map((cell) => {
                        const className = cell.id.includes('actions')
                          ? 'p-0'
                          : 'p-2';
                        return (
                          <TableCell key={cell.id} className={className}>
                            {
                              flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              ) as JSX.Element
                            }
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {row.getIsExpanded() && renderSubComponent && (
                      <TableRow>
                        <TableCell
                          colSpan={row.getVisibleCells().length}
                          className="p-0"
                        >
                          {renderSubComponent(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TableFooter
          inputProps={inputProps}
          table={table}
          selectedRows={selectedRows}
          setTableData={setTableData}
          tableData={tableData}
        />
      </div>
    </div>
  );
}
