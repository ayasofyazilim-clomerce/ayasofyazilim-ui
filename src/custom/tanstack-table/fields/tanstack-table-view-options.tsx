"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Table } from "@tanstack/react-table";

import { ChevronDownIcon } from "lucide-react";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@repo/ayasofyazilim-ui/components/dropdown-menu";
import {
  TanstackTableSelectedRowActionType,
  TanstackTableTableActionsType,
} from "../types";

interface TanstackTableViewOptionsProps<TData> {
  editable?: boolean;
  selectedRowAction?: TanstackTableSelectedRowActionType<TData>;
  setTableAction: (actions: TanstackTableTableActionsType<TData>) => void;
  table: Table<TData>;
  tableActions?: TanstackTableTableActionsType<TData>[];
  tableData: TData[];
}

function TablePrimaryActionButton<TData>({
  table,
  action,
  setRowAction,
}: {
  action: TanstackTableTableActionsType<TData>;
  setRowAction: (actions: TanstackTableTableActionsType<TData>) => void;
  table: Table<TData>;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={() => handleActionOnClick(table, action, setRowAction)}
    >
      {action?.icon && <action.icon className="mr-2 h-4 w-4" />}
      {action.cta?.toString()}
    </Button>
  );
}
function handleActionOnClick<TData>(
  table: Table<TData>,
  action: TanstackTableTableActionsType<TData>,
  setRowAction: (actions: TanstackTableTableActionsType<TData>) => void,
) {
  if (action.type === "simple") {
    action.onClick();
    return;
  }
  if (action.type === "create-row") {
    table.options.meta?.addRow(-1, "", null);
    action?.onClick?.();
    return;
  }
  setRowAction(action);
}

export function TanstackTableViewOptions<TData>(
  props: TanstackTableViewOptionsProps<TData>,
) {
  const {
    table,
    tableActions,
    selectedRowAction,
    setTableAction: setRowAction,
    tableData,
    editable,
  } = props;

  // Filter actions based on condition, keeping backward compatibility
  const filteredActions =
    tableActions?.filter(
      (action) => !action.condition || action.condition(tableData),
    ) ?? [];

  const primaryAction = filteredActions[0];
  const secondaryAction = filteredActions[1];
  const otherActions = filteredActions.slice(2);
  const selectedRowCount = Object.keys(table.getState().rowSelection).length;

  return (
    <>
      {selectedRowAction && selectedRowCount > 0 && (
        <div
          className={
            primaryAction &&
            ((primaryAction.condition &&
              primaryAction.condition?.(tableData)) ||
              true) &&
            otherActions &&
            "mr-2"
          }
        >
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="ml-2"
            onClick={() => {
              const selectedRowIds = table.getState().rowSelection;
              selectedRowAction.onClick(Object.keys(selectedRowIds), tableData);
            }}
          >
            {selectedRowAction?.icon && (
              <selectedRowAction.icon className="mr-2 h-4 w-4" />
            )}
            {`${selectedRowAction.cta?.toString()} (${selectedRowCount})`}
          </Button>
        </div>
      )}

      {editable && null}

      <div className="space-x-2">
        {primaryAction && (
          <TablePrimaryActionButton
            table={table}
            action={primaryAction}
            setRowAction={setRowAction}
          />
        )}
        {secondaryAction && (
          <TablePrimaryActionButton
            table={table}
            action={secondaryAction}
            setRowAction={setRowAction}
          />
        )}
        {otherActions && otherActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                type="button"
                variant="outline"
                className="px-2"
              >
                <ChevronDownIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {otherActions?.map((action) => (
                <DropdownMenuItem key={action.cta}>
                  <Button
                    variant="ghost"
                    type="button"
                    size="sm"
                    className="justify-start w-full"
                    onClick={() =>
                      handleActionOnClick(table, action, setRowAction)
                    }
                  >
                    {action.icon && <action.icon className="w-4 h-4" />}
                    <span className="ml-2">{action.cta}</span>
                  </Button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </>
  );
}
