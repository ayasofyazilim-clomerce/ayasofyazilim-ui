"use client";

import { Loader } from "lucide-react";
import * as React from "react";

import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ayasofyazilim-ui/components/dialog";
import { TanstackTableRowActionsConfirmationDialog } from "../types";

type TanstackTableConfirmationDialogProps<TData> = {
  row: TData;
  setDialogOpen: () => void;
} & TanstackTableRowActionsConfirmationDialog<TData>;
export function TanstackTableConfirmationDialog<TData>({
  row,
  title,
  confirmationText,
  onCancel,
  onConfirm,
  cancelText,
  description,
  setDialogOpen,
}: TanstackTableConfirmationDialogProps<TData>) {
  const dialogTitle = typeof title === "function" ? title(row) : title;

  const [isDeletePending, startDeleteTransition] = React.useTransition();

  const handleOnConfirmClick = () => {
    startDeleteTransition(() => {
      onConfirm(row);
      setDialogOpen();
    });
  };
  const handleOnCancelClick = () => {
    startDeleteTransition(() => {
      onCancel?.(row);
      setDialogOpen();
    });
  };

  return (
    <Dialog open onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <DialogClose asChild>
            <Button variant="outline" onClick={handleOnCancelClick}>
              {cancelText}
            </Button>
          </DialogClose>
          <Button
            aria-label={confirmationText}
            variant="destructive"
            onClick={handleOnConfirmClick}
            disabled={isDeletePending}
          >
            {isDeletePending && (
              <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            {confirmationText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
