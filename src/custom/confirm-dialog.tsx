"use client";

import { JSX, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@repo/ayasofyazilim-ui/components/dialog";
import { Button, ButtonProps } from "@repo/ayasofyazilim-ui/components/button";
import { Skeleton } from "@repo/ayasofyazilim-ui/components/skeleton";

export type ConfirmDialogProps = {
  closeProps?: ButtonProps;
  confirmProps?: ButtonProps & {
    closeAfterConfirm?: boolean;
    onConfirm?: () => void | Promise<void>;
  };
  description: string | JSX.Element;
  loading?: boolean;
  title: string | JSX.Element;
} & (WithTriggerConfirmDialogProps | WithoutTriggerConfirmDialogProps);
type WithTriggerConfirmDialogProps = {
  triggerProps: ButtonProps & { "data-testid"?: string };
  type: "with-trigger";
};
type WithoutTriggerConfirmDialogProps = {
  type: "without-trigger";
  children: JSX.Element;
};
export default function ConfirmDialog(props: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const isWithTrigger = props.type === "with-trigger";
  const { title, description, loading, confirmProps } = props;
  const { closeAfterConfirm, onConfirm, ...confirmButtonProps } =
    confirmProps || {};
  return (
    <Dialog open={open && loading ? true : open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isWithTrigger ? (
          <Button
            type="button"
            {...props.triggerProps}
            onClick={(e) => {
              setOpen(true);
              if (props.triggerProps?.onClick) props.triggerProps.onClick(e);
            }}
          >
            {props.triggerProps.children}
          </Button>
        ) : (
          props.children
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {loading ? (
            <Skeleton className="w-20 h-9" />
          ) : (
            <DialogClose asChild disabled={loading}>
              <Button
                variant="outline"
                type="button"
                {...props.closeProps}
                disabled={loading}
              >
                {props.closeProps?.children || "Cancel"}
              </Button>
            </DialogClose>
          )}
          {loading ? (
            <Skeleton className="w-20 h-9" />
          ) : (
            <Button
              type="button"
              {...confirmButtonProps}
              onClick={async (e) => {
                if (props.confirmProps?.onClick) {
                  props.confirmProps.onClick(e);
                }
                if (onConfirm) {
                  await onConfirm();
                  if (closeAfterConfirm) setOpen(false);
                }
              }}
            >
              {props.confirmProps?.children || "Confirm"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
