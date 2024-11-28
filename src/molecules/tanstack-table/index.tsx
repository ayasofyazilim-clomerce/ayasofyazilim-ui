'use client';

import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  RowData,
  SortingState,
  useReactTable,
  VisibilityState,
  Table as TableType,
} from '@tanstack/react-table';
import React, { Fragment, useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TanstackTableAutoformDialog,
  TanstackTableConfirmationDialog,
  TanstackTableCustomDialog,
  TanstackTablePagination,
  TanstackTableRowActions,
  TanstackTableTableAutoformDialog,
  TanstackTableTableCustomDialog,
  TanstackTableToolbar,
} from './fields';
import {
  TanstackTableProps,
  TanstackTableRowActionsType,
  TanstackTableTableActionsType,
} from './types';
import { getCommonPinningStyles } from './utils';
import { cn } from '@/lib/utils';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    addRow: (rowIndex: number, columnId: string, value: unknown) => void;
    removeRow: (rowIndex: number, columnId: string, value: unknown) => void;
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

const CellWithActions = <TData,>(
  table: TableType<TData>,
  row: Row<TData>,
  actions: TanstackTableRowActionsType<TData>[],
  setRowAction: (
    actions: TanstackTableRowActionsType<TData> & { row: TData }
  ) => void
) => (
  <TanstackTableRowActions
    row={row}
    actions={actions}
    setRowAction={setRowAction}
    table={table}
  />
);

export default function TanstackTable<TData, TValue>({
  columns,
  columnOrder,
  data,
  rowCount = 0,
  filters,
  columnVisibility,
  pinColumns,
  rowActions,
  tableActions,
  selectedRowAction,
  expandedRowComponent,
  fillerColumn,
  editable = false,
  showPagination = true,
  onTableDataChange,
}: TanstackTableProps<TData, TValue>) {
  const { replace } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [newlyAddedRows, setNewlyAddedRows] = useState<TData[]>([]);
  const tableData = useMemo<TData[]>(
    () => [...newlyAddedRows, ...data],
    [data, newlyAddedRows]
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [colVisibility, setColumnVisibility] = useState<VisibilityState>(
    columnVisibility
      ? Object.fromEntries(
          columns.map((col) => [
            col.id || '',
            columnVisibility?.columns.includes(
              (col.id || '') as keyof TData
            ) ===
              (columnVisibility.type === 'show'),
          ])
        )
      : {}
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowAction, setRowAction] = React.useState<
    (TanstackTableRowActionsType<TData> & { row: TData }) | null
  >(null);
  const [tableAction, setTableAction] =
    React.useState<TanstackTableTableActionsType | null>(null);

  const tableColumns = useMemo(() => {
    const _columns = [...columns];

    if (rowActions) {
      _columns.push({
        id: 'actions',
        cell: ({ row }) =>
          CellWithActions(table, row, rowActions, setRowAction),
      });
    }
    return _columns;
  }, [columns, rowActions]);

  const [pagination, setPagination] = useState(() => {
    const currentPagination = { pageIndex: 0, pageSize: 10 };
    if (searchParams?.get('maxResultCount')) {
      currentPagination.pageSize =
        Number(searchParams?.get('maxResultCount')) || 10;
    }
    if (searchParams?.get('skipCount')) {
      currentPagination.pageIndex =
        Number(searchParams?.get('skipCount')) / currentPagination.pageSize ||
        0;
    }
    return currentPagination;
  });

  const [editedRows, setEditedRows] = React.useState<TData[]>(() => [
    ...tableData,
  ]);

  const getRowId = React.useCallback(
    (row: TData) => (row as TData & { id: string }).id,
    []
  );

  useEffect(() => {
    if (rowAction?.type === 'simple') {
      rowAction.onClick(rowAction.row);
      setRowAction(null);
    }
  }, [rowAction]);

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getRowId,
    state: {
      sorting,
      columnVisibility: colVisibility,
      columnFilters,
      pagination,
    },
    initialState: {
      columnOrder: columnOrder as string[],
      columnPinning: {
        left: [
          'expanded-content',
          'select',
          ...((pinColumns as string[]) ?? []),
        ],
        right: ['actions'],
      },
    },
    enableRowSelection: true,
    enableColumnPinning: true,
    manualPagination: true,
    getRowCanExpand: () => !!expandedRowComponent,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    rowCount,
    meta: {
      removeRow: (rowIndex) => {
        setNewlyAddedRows((old) =>
          old.filter((_row, index) => index !== rowIndex)
        );
        setEditedRows((old) => old.filter((_row, index) => index !== rowIndex));
        onTableDataChange?.(
          editedRows.filter((_row, index) => index !== rowIndex)
        );
        // FIX : DOES NOT REMOVE ROW THAT COMES FROM INITIAL DATA
      },
      updateData: (rowIndex, columnId, value) => {
        const newEditedRows = [...editedRows];
        const indexOfEditedRow = newEditedRows.findIndex(
          (row) =>
            (row as TData & { id: string }).id ===
            (editedRows[rowIndex] as TData & { id: string }).id
        );
        newEditedRows[indexOfEditedRow] = {
          ...newEditedRows[indexOfEditedRow],
          [columnId]: value,
        };
        setEditedRows(newEditedRows);
        onTableDataChange?.(newEditedRows);
      },
      addRow: () => {
        const newData = { id: `new-${Date.now()}` } as TData;
        const updatedData = [newData, ...editedRows];
        setNewlyAddedRows((old) => [newData, ...old]);
        setEditedRows(updatedData);
        onTableDataChange?.(updatedData);
      },
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (Number(searchParams?.get('maxResultCount')) !== pagination.pageSize) {
      params.set('maxResultCount', pagination.pageSize.toString());
    }
    if (
      Number(searchParams?.get('skipCount')) !==
      pagination.pageIndex * pagination.pageSize
    ) {
      params.set(
        'skipCount',
        (pagination.pageIndex * pagination.pageSize).toString()
      );
    }
    if (Number(params?.get('maxResultCount')) === 10) {
      params.delete('maxResultCount');
    }
    if (Number(params?.get('skipCount')) === 0) {
      params.delete('skipCount');
    }

    replace(`${pathname}?${params.toString()}`);
  }, [pagination]);
  return (
    <div className="space-y-4 flex flex-col h-full">
      <TanstackTableToolbar<TData>
        table={table}
        filters={filters}
        selectedRowAction={selectedRowAction}
        tableActions={tableActions}
        editedRows={editedRows}
        setTableAction={setTableAction}
      />
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  if (header.id === 'actions') return null;
                  return (
                    <TableHead
                      key={header.id}
                      style={getCommonPinningStyles({
                        column: header.column,
                        withBorder: true,
                        fillerColumn,
                      })}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(editable && '[&>td:last-child]:border-r-0')}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(editable && 'p-0 border border-b-0')}
                        style={getCommonPinningStyles({
                          column: cell.column,
                          withBorder: true,
                          fillerColumn,
                        })}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && expandedRowComponent && (
                    <TableRow>
                      <TableCell colSpan={row.getAllCells().length}>
                        {expandedRowComponent(
                          row.original,
                          row.getToggleExpandedHandler()
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-auto text-center"
                >
                  No data results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination && <TanstackTablePagination table={table} />}
      {rowAction?.type === 'confirmation-dialog' && (
        <TanstackTableConfirmationDialog<TData>
          setDialogOpen={() => setRowAction(null)}
          row={rowAction.row}
          title={rowAction.title}
          description={rowAction.description}
          confirmationText={rowAction.confirmationText}
          cancelText={rowAction.cancelText}
          onConfirm={rowAction.onConfirm}
          onCancel={rowAction.onCancel}
          type="confirmation-dialog"
        />
      )}
      {rowAction?.type === 'custom-dialog' && (
        <TanstackTableCustomDialog<TData>
          setDialogOpen={() => setRowAction(null)}
          row={rowAction.row}
          title={rowAction.title}
          content={rowAction.content}
          confirmationText={rowAction.confirmationText}
          cancelText={rowAction.cancelText}
          onConfirm={rowAction.onConfirm}
          onCancel={rowAction.onCancel}
          type="custom-dialog"
        />
      )}
      {rowAction?.type === 'autoform-dialog' && (
        <TanstackTableAutoformDialog<TData>
          setDialogOpen={() => setRowAction(null)}
          row={rowAction.row}
          title={rowAction.title}
          schema={rowAction.schema}
          submitText={rowAction.submitText}
          onSubmit={rowAction.onSubmit}
          values={rowAction.values}
          type="autoform-dialog"
        />
      )}
      {tableAction?.type === 'autoform-dialog' && (
        <TanstackTableTableAutoformDialog
          setDialogOpen={() => setTableAction(null)}
          title={tableAction.title}
          schema={tableAction.schema}
          submitText={tableAction.submitText}
          onSubmit={tableAction.onSubmit}
          values={tableAction.values}
          type="autoform-dialog"
        />
      )}
      {tableAction?.type === 'custom-dialog' && (
        <TanstackTableTableCustomDialog
          setDialogOpen={() => setTableAction(null)}
          title={tableAction.title}
          type="custom-dialog"
          content={tableAction.content}
          confirmationText={tableAction.confirmationText}
          cancelText={tableAction.cancelText}
          onConfirm={tableAction.onConfirm}
          onCancel={tableAction.onCancel}
        />
      )}
    </div>
  );
}
