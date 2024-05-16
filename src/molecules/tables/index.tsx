// @ts-nocheck

'use client';

import * as React from 'react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AutoformDialog from '../dialog';
import { columnsGenerator } from './columnsGenerator';
import { normalizeName } from './utils';
import { Skeleton } from '@/components/ui/skeleton';

export type tableAction = {
  autoFormArgs: any;
  callback: (values: any) => void;
  cta: string;
  description: string;
};

type autoColumnGnerator = {
  autoFormArgs: any;
  callback: any;
  excludeList: string[];
  onDelete: (e: any, originalRow: any) => void;
  onEdit: (e: any, originalRow: any) => void;
  tableType: any;
};

type columnsType = {
  data: ColumnDef<any>[] | autoColumnGnerator;
  type: 'Custom' | 'Auto';
};

export type DataTableProps<TData> = {
  action?: tableAction;
  columnsData: columnsType;
  data: TData[];
  filterBy: string;
  isLoading?: boolean;
};
const SkeletonCell = () => <Skeleton className="w-20 h-3" />;

export default function DataTable<TData, TValue>({
  columnsData,
  data,
  filterBy,
  action,
  isLoading,
}: DataTableProps<TData>) {
  let tableData = data;

  function selectedRowsText() {
    if (isLoading) return 'Loading...';
    return `${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected.`;
  }

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  let columns: ColumnDef<any, any>[] = [];
  if (columnsData.type === 'Auto') {
    const tempData = columnsData.data as autoColumnGnerator;
    columns = columnsGenerator(
      tempData.callback,
      tempData.autoFormArgs,
      tempData.tableType,
      tempData.onEdit,
      tempData.onDelete,
      tempData.excludeList
    );
  } else {
    columns = columnsData.data as ColumnDef<TData, TValue>[];
  }
  if (isLoading) {
    tableData = Array(6).fill({});
    columns = columns.map((column) => ({
      ...column,
      cell: SkeletonCell,
    }));
  }
  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: (filters) => {
      if (isLoading) return;
      setColumnFilters(filters);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (row) => {
      if (isLoading) return;
      setRowSelection(row);
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="w-full">
      <AutoformDialog open={isOpen} onOpenChange={setIsOpen} action={action} />
      <div className="flex items-center py-4">
        <Input
          disabled={isLoading}
          placeholder={`Filter ${filterBy}s...`}
          value={(table.getColumn(filterBy)?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn(filterBy)?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isLoading} variant="outline" className="ml-auto">
              View <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {normalizeName(column.id)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {action ? (
          <Button
            disabled={isLoading}
            variant="outline"
            onClick={() => setIsOpen(true)}
          >
            {action?.cta}
          </Button>
        ) : null}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {selectedRowsText()}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
