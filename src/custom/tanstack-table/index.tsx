"use client";
"use no memo";
import {
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

import {
  TanstackTableActionDialogs,
  TanstackTablePagination,
  TanstackTablePlainTable,
  TanstackTableToolbar,
} from "./fields";

import {
  TanstackBaseProps,
  TanstackTablePropsType,
  TanstackTableRowActionsType,
  TanstackTableTableActionsType,
} from "./types";
import {
  CellWithActions,
  EditableTanstackTable,
  NonEditableTanstackTable,
} from "./utils";

declare module "@tanstack/react-table" {
  // eslint-disaxxble-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    addRow: (rowIndex: number, columnId: string, value: unknown) => void;
    removeRow: (rowIndex: number, columnId: string, value: unknown) => void;
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    duplicateRow: (rowIndex: number, value: TData) => void;
    orderRow: (newIndex: number, oldIndex: number) => void;
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
  excludeColumns,
  onTableDataChange,
  filters,
  title,
  resizeable = true,
  showPagination = true,
}: TanstackTablePropsType<TData, TValue>) {
  const commonProps = {
    pinColumns,
    columnOrder,
    columnVisibility,
    rowActions,
    tableActions,
    selectedRowAction,
    excludeColumns,
    expandedRowComponent,
    title,
    resizeable,
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
      filters={filters}
      fillerColumn={fillerColumn}
      showPagination={showPagination}
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
    excludeColumns,
    onPaginationChange,
    onColumnFiltersChange,
    columnFilters,
    pagination,
    filters,
    meta,
    showPagination,
    title,
    resizeable,
  } = props;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [colVisibility, setColumnVisibility] = useState<VisibilityState>(
    columnVisibility
      ? Object.fromEntries(
        columns.map((col) => [
          col.id || "",

          columnVisibility?.columns.includes(
            (col.id || "") as keyof TData
          ) ===
          (columnVisibility.type === "show"),
        ])
      )
      : {}
  );
  const [rowAction, setRowAction] = useState<
    (TanstackTableRowActionsType<TData> & { row: TData }) | null
  >(null);
  const [tableAction, setTableAction] =
    useState<TanstackTableTableActionsType<TData> | null>(null);

  const tableColumns = useMemo(() => {
    const _columns = [...columns].filter(
      (col) => !excludeColumns?.includes(col.id as keyof TData)
    );

    if (rowActions) {
      _columns.push({
        id: "actions",
        cell: ({ row }) =>
          CellWithActions(table, row, rowActions, setRowAction),
      });
    }
    if (!resizeable) return _columns;
    return _columns.map((col) => ({
      ...col,
      minSize: fillerColumn === col.id ? 600 : undefined,
    }));
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
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
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
          "expanded-content",
          "select",
          ...((pinColumns as string[]) ?? []),
        ],
        right: ["actions"],
      },
    },
    enableRowSelection: true,
    enableColumnResizing: true,
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
    <div className="flex flex-col gap-2 overflow-hidden">
      <TanstackTableToolbar<TData>
        title={title}
        table={table}
        filters={filters}
        selectedRowAction={selectedRowAction}
        tableActions={tableActions}
        tableData={data}
        setTableAction={setTableAction}
        editable={editable}
      />
      <div className="rounded-md border overflow-auto flex-1 h-0 max-h-max">
        <TanstackTablePlainTable
          resizeable={resizeable}
          table={table}
          columns={tableColumns}
          editable={editable}
          expandedRowComponent={expandedRowComponent}
          fillerColumn={fillerColumn}
        />
      </div>
      {pagination && showPagination && (
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
