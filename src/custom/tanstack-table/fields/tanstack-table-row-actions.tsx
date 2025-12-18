"use client";

import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";
import { Row, Table } from "@tanstack/react-table";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ayasofyazilim-ui/components/dropdown-menu";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { TanstackTableRowActionsType } from "../types";

interface TanstackTableRowActionsProps<TData> {
  actions: TanstackTableRowActionsType<TData>[];
  row: Row<TData>;
  setRowAction: (
    actions: TanstackTableRowActionsType<TData> & { row: TData }
  ) => void;
  table: Table<TData>;
}

export const TanstackTableRowActions = <TData,>({
  row,
  setRowAction,
  actions,
  table,
}: TanstackTableRowActionsProps<TData>) => {
  const availableActions = actions.filter(
    (i) => !i.condition || (i.condition && i.condition?.(row.original))
  );
  if (availableActions.length === 0) return null;

  if (availableActions.length === 1) {
    return (
      <ActionButton
        action={availableActions[0] as TanstackTableRowActionsType<TData>}
        className="h-9 justify-center rounded-none"
        setRowAction={setRowAction}
        table={table}
        row={row}
      />
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full justify-start" asChild>
        <Button
          variant="ghost"
          type="button"
          className="flex bg-white rounded-none"
        >
          Actions
          <span className="sr-only">Open Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableActions.map((action) => {
          if (action.condition && !action.condition?.(row.original))
            return null;
          if (
            (action.type === "move-row-down" &&
              row.index === table.getRowCount() - 1) ||
            (action.type === "move-row-up" && row.index === 0)
          )
            return null;
          return (
            <DropdownMenuItem key={action.cta}>
              <ActionButton
                action={action}
                table={table}
                row={row}
                setRowAction={setRowAction}
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function ActionButton<TData>({
  row,
  setRowAction,
  table,
  action,
  className,
}: {
  action: TanstackTableRowActionsType<TData>;
  className?: string;
  row: Row<TData>;
  setRowAction: (
    actions: TanstackTableRowActionsType<TData> & { row: TData }
  ) => void;
  table: Table<TData>;
}) {
  function handleOnActionClick(action: TanstackTableRowActionsType<TData>) {
    if (action.type === "simple") {
      action.onClick(row.original);
      return;
    }
    if (action.type === "delete-row") {
      table.options.meta?.removeRow(row.index, "", null);
      return;
    }
    if (action.type === "duplicate-row") {
      table.options.meta?.duplicateRow(row.index + 1, row.original);
      return;
    }
    if (action.type === "move-row-up") {
      table.options.meta?.orderRow(row.index, row.index - 1);
      return;
    }
    if (action.type === "move-row-down") {
      table.options.meta?.orderRow(row.index, row.index + 1);
      return;
    }
    setRowAction({ ...action, row: row.original });
  }
  if (action.type === "move-row-down" && row.index === table.getRowCount() - 1)
    return null;
  if (action.type === "move-row-up" && row.index === 0) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      className={cn("justify-start w-full", className)}
      onClick={() => handleOnActionClick(action)}
    >
      {action.icon && <action.icon className="w-4 h-4" />}
      {!action.icon && action.type === "move-row-down" && (
        <ArrowDown className="w-4 h-4" />
      )}
      {!action.icon && action.type === "move-row-up" && (
        <ArrowUp className="w-4 h-4" />
      )}
      {!action.icon && action.type === "duplicate-row" && (
        <Copy className="w-4 h-4" />
      )}
      {!action.icon && action.type === "delete-row" && (
        <Trash2 className="w-4 h-4" />
      )}
      <span className="md:ml-2 in-data-[slot=dropdown-menu-item]:block hidden md:block">{action.cta}</span>
    </Button>
  );
}
