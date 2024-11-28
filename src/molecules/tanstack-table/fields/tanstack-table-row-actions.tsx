'use client';

import { Row, Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TanstackTableRowActionsType } from '../types';
import { cn } from '@/lib/utils';

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
  if (actions.length === 1) {
    return (
      <ActionButton
        action={actions[0]}
        className="h-9"
        setRowAction={setRowAction}
        table={table}
        row={row}
      />
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          type="button"
          className="flex data-[state=open]:bg-muted"
        >
          Actions
          <span className="sr-only">Open Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem key={action.cta}>
            <ActionButton
              action={action}
              table={table}
              row={row}
              setRowAction={setRowAction}
            />
          </DropdownMenuItem>
        ))}
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
    if (action.type === 'simple') {
      action.onClick(row.original);
      return;
    }
    if (action.type === 'delete-row') {
      table.options.meta?.removeRow(row.index, '', null);
    }
    setRowAction({ ...action, row: row.original });
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      className={cn('justify-start w-full', className)}
      onClick={() => handleOnActionClick(action)}
    >
      {action.icon && <action.icon className="w-4 h-4" />}
      <span className="ml-2">{action.cta}</span>
    </Button>
  );
}
