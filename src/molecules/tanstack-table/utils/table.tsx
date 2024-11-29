import { ColumnFiltersState } from '@tanstack/react-table';
import { useState, useEffect } from 'react';
import {
  EditableTanstackTableProps,
  NonEditableTanstackTableProps,
} from '../types';

export function NonEditableTanstackTable<TData>(
  data: TData[],
  rowCount: number
): NonEditableTanstackTableProps<TData> {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [pagination, setPagination] = useState<{
    pageIndex: number;
    pageSize: number;
  }>({ pageIndex: 0, pageSize: 10 });

  return {
    data,
    rowCount,
    pagination,
    columnFilters,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
  };
}

export function EditableTanstackTable<TData>({
  initialData,
  onTableDataChange,
}: {
  initialData: TData[];
  onTableDataChange?: (data: TData[]) => void;
}): EditableTanstackTableProps<TData> {
  const [tableData, setTableData] = useState<TData[]>(initialData);
  useEffect(() => {
    // When user submits the form, the initialData changes with the new data
    // so we need to update the table data
    setTableData(initialData);
  }, [initialData]);

  return {
    data: tableData,
    meta: {
      removeRow: (rowIndex) => {
        const newData = [...tableData];
        newData.splice(rowIndex, 1);
        setTableData(newData);
        onTableDataChange?.(newData);
      },
      updateData: (rowIndex, columnId, value) => {
        const newData = [...tableData];
        newData[rowIndex] = {
          ...newData[rowIndex],
          [columnId]: value,
        };
        setTableData(newData);
        onTableDataChange?.(newData);
      },
      addRow: () => {
        const newData = [...tableData, {} as TData];
        console.log(newData);
        setTableData(newData);
        onTableDataChange?.(newData);
      },
    },
  };
}
