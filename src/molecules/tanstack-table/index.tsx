'use client';

import {
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';

import {
  TanstackTableActionDialogs,
  TanstackTablePagination,
  TanstackTablePlainTable,
  TanstackTableToolbar,
} from './fields';

import {
  TanstackBaseProps,
  TanstackTablePropsType,
  TanstackTableRowActionsType,
  TanstackTableTableActionsType,
} from './types';
import {
  CellWithActions,
  EditableTanstackTable,
  NonEditableTanstackTable,
} from './utils';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    addRow: (rowIndex: number, columnId: string, value: unknown) => void;
    removeRow: (rowIndex: number, columnId: string, value: unknown) => void;
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

export default function TanstackTable<TData, TValue>({
  data,
  rowCount,
  columns,
  columnOrder,
  columnVisibility,
  pinColumns,
  rowActions,
  tableActions,
  selectedRowAction,
  expandedRowComponent,
  fillerColumn,
  editable,
  onTableDataChange,
}: TanstackTablePropsType<TData, TValue>) {
  const commonProps = {
    pinColumns,
    columnOrder,
    columnVisibility,
    rowActions,
    tableActions,
    selectedRowAction,
    expandedRowComponent,
  };
  if (editable) {
    return (
      <TanstackBase<TData, TValue>
        {...commonProps}
        {...EditableTanstackTable({ initialData: data, onTableDataChange })}
        columns={columns}
        editable
        fillerColumn={fillerColumn}
      />
    );
  }
  return (
    <TanstackBase<TData, TValue>
      {...commonProps}
      {...NonEditableTanstackTable(data, rowCount || 0)}
      columns={columns}
      editable={false}
      fillerColumn={fillerColumn}
    />
  );
}

function TanstackBase<TData, TValue>(props: TanstackBaseProps<TData, TValue>) {
  const {
    data,
    columns,
    columnOrder,
    rowCount,
    columnVisibility,
    pinColumns,
    rowActions,
    tableActions,
    selectedRowAction,
    expandedRowComponent,
    fillerColumn,
    editable,
    onPaginationChange,
    onColumnFiltersChange,
    columnFilters,
    pagination,
    filters,
    meta,
  } = props;
  const [sorting, setSorting] = useState<SortingState>([]);
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
  const [rowAction, setRowAction] = useState<
    (TanstackTableRowActionsType<TData> & { row: TData }) | null
  >(null);
  const [tableAction, setTableAction] =
    useState<TanstackTableTableActionsType | null>(null);

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

  const getRowId = useCallback(
    (row: TData, index: number) =>
      editable ? index.toString() : (row as TData & { id: string }).id,
    []
  );

  const table = useReactTable({
    data,
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
    onPaginationChange,
    onColumnFiltersChange,
    rowCount,
    meta,
  });

  return (
    <div className="space-y-4 flex flex-col h-full">
      <TanstackTableToolbar<TData>
        table={table}
        filters={filters}
        selectedRowAction={selectedRowAction}
        tableActions={tableActions}
        tableData={data}
        setTableAction={setTableAction}
      />
      <div className="rounded-md border overflow-auto">
        <TanstackTablePlainTable
          table={table}
          columns={tableColumns}
          fillerColumn={fillerColumn}
          editable={editable}
          expandedRowComponent={expandedRowComponent}
        />
      </div>
      {pagination && (
        <TanstackTablePagination table={table} pagination={pagination} />
      )}
      <TanstackTableActionDialogs
        tableAction={tableAction}
        setTableAction={setTableAction}
        rowAction={rowAction}
        setRowAction={setRowAction}
      />
    </div>
  );
}
