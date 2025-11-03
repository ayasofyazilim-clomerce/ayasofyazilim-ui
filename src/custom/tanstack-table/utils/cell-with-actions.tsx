"use client";

import { Row, Table as TableType } from "@tanstack/react-table";
import { TanstackTableRowActions } from "../fields";
import { TanstackTableRowActionsType } from "../types";

export const CellWithActions = <TData,>(
  table: TableType<TData>,
  row: Row<TData>,
  actions: TanstackTableRowActionsType<TData>[],
  setRowAction: (
    actions: TanstackTableRowActionsType<TData> & { row: TData },
  ) => void,
) => (
  <TanstackTableRowActions
    row={row}
    actions={actions}
    setRowAction={setRowAction}
    table={table}
  />
);
