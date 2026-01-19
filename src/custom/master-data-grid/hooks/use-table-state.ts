import { useState } from "react";
import type { TableState } from "../types";

interface UseTableStateOptions {
  pageSize?: number;
  groupBy?: string[];
  expanded?: Record<string, boolean>;
}

export function useTableState(options: UseTableStateOptions = {}) {
  const { pageSize = 10, groupBy = [], expanded = {} } = options;

  const [tableState, setTableState] = useState<TableState>(() => {
    return {
      sorting: [],
      columnFilters: [],
      columnVisibility: {},
      rowSelection: {},
      columnPinning: { left: [], right: [] },
      grouping: groupBy,
      expanded,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
      editingRows: {},
    };
  });

  return [tableState, setTableState] as const;
}
