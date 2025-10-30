import React, { Dispatch, useEffect } from 'react';
import {
  TanstackTableConfirmationDialog,
  TanstackTableCustomDialog,
  TanstackTableTableCustomDialog,
} from '.';
import {
  TanstackTableRowActionsType,
  TanstackTableTableActionsType,
} from '../types';
import { TanstackTableTableSchemaFormDialog } from './tanstack-table-table-actions-schemaform-dialog';

export function TanstackTableActionDialogs<TData>({
  rowAction,
  setRowAction,
  tableAction,
  setTableAction,
}: {
  rowAction: (TanstackTableRowActionsType<TData> & { row: TData }) | null;
  setRowAction: Dispatch<
    React.SetStateAction<
      | (TanstackTableRowActionsType<TData> & {
        row: TData;
      })
      | null
    >
  >;
  setTableAction: Dispatch<
    React.SetStateAction<TanstackTableTableActionsType<TData> | null>
  >;
  tableAction: TanstackTableTableActionsType<TData> | null;
}) {
  useEffect(() => {
    if (rowAction?.type === 'simple') {
      rowAction.onClick(rowAction.row);
      setRowAction(null);
    }
  }, [rowAction]);

  return (
    <>
      {rowAction?.type === 'confirmation-dialog' && (
        <TanstackTableConfirmationDialog<TData>
          setDialogOpen={() => setRowAction(null)}
          row={rowAction.row}
          title={rowAction.title}
          description={rowAction.description}
          confirmationText={rowAction.confirmationText}
          cancelText={rowAction.cancelText}
          onConfirm={rowAction.onConfirm}
          onCancel={rowAction.onCancel}
          type="confirmation-dialog"
        />
      )}
      {rowAction?.type === 'custom-dialog' && (
        <TanstackTableCustomDialog<TData>
          setDialogOpen={() => setRowAction(null)}
          row={rowAction.row}
          title={rowAction.title}
          content={rowAction.content}
          confirmationText={rowAction.confirmationText}
          cancelText={rowAction.cancelText}
          onConfirm={rowAction.onConfirm}
          onCancel={rowAction.onCancel}
          type="custom-dialog"
        />
      )}
      {tableAction?.type === 'custom-dialog' && (
        <TanstackTableTableCustomDialog
          setDialogOpen={() => setTableAction(null)}
          title={tableAction.title}
          type="custom-dialog"
          content={tableAction.content}
          confirmationText={tableAction.confirmationText}
          cancelText={tableAction.cancelText}
          onConfirm={tableAction.onConfirm}
          onCancel={tableAction.onCancel}
          dialogClassNames={tableAction.dialogClassNames}
        />
      )}
      {tableAction?.type === 'schemaform-dialog' && (
        <TanstackTableTableSchemaFormDialog<TData>
          setDialogOpen={() => setTableAction(null)}
          {...tableAction}
        />
      )}
    </>
  );
}
