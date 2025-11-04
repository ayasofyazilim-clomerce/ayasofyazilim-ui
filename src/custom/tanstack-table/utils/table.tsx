"use client";

import { ColumnFiltersState } from "@tanstack/react-table";
import { useState, useEffect } from "react";
import {
  EditableTanstackTableProps,
  NonEditableTanstackTableProps,
} from "../types";

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
        } as TData;
        setTableData(newData);
        onTableDataChange?.(newData);
      },
      addRow: () => {
        const newData = [...tableData, {} as TData];
        setTableData(newData);
        onTableDataChange?.(newData);
      },
      duplicateRow: (rowIndex, value) => {
        const newData = [...tableData];
        newData.splice(rowIndex, 0, value);
        setTableData(newData);
        onTableDataChange?.(newData);
      },
      orderRow: (newIndex, oldIndex) => {
        const newData = [...tableData];
        const item = newData.splice(oldIndex, 1)[0] as TData;
        newData.splice(newIndex, 0, item);
        setTableData(newData);
        onTableDataChange?.(newData);
      },
    },
  };
}
