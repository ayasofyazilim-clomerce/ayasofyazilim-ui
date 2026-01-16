import { useCallback, useState } from "react";
import type { Table as TanstackTable } from "@tanstack/react-table";
import type { ColumnFilter, FilterDialogState } from "../types";

export function useFilters<TData>(table: TanstackTable<TData>) {
  const [filterDialogState, setFilterDialogState] = useState<FilterDialogState>(
    {
      open: false,
      columnId: null,
    }
  );

  const handleApplyFilter = useCallback(
    (filter: ColumnFilter) => {
      const column = table.getColumn(filter.id);
      if (column) {
        column.setFilterValue(filter);
      }
    },
    [table]
  );

  const handleClearFilter = useCallback(() => {
    if (filterDialogState.columnId) {
      const column = table.getColumn(filterDialogState.columnId);
      column?.setFilterValue(undefined);
    }
  }, [table, filterDialogState.columnId]);

  const openFilterDialog = useCallback((columnId: string) => {
    setFilterDialogState({ open: true, columnId });
  }, []);

  return {
    filterDialogState,
    setFilterDialogState,
    handleApplyFilter,
    handleClearFilter,
    openFilterDialog,
  };
}
