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
import { cn } from "../lib/utils";

export type ConfirmDialogProps = {
  closeProps?: ButtonProps & { label?: string };
  confirmProps?: ButtonProps & {
    label?: string;
    closeAfterConfirm?: boolean;
    onConfirm?: () => void | Promise<void>;
  };
  description: string | JSX.Element;
  loading?: boolean;
  title: string | JSX.Element;
} & (WithTriggerConfirmDialogProps | WithoutTriggerConfirmDialogProps);
type WithTriggerConfirmDialogProps = {
  triggerProps: ButtonProps & { "data-testid"?: string; label?: string };
  type: "with-trigger";
};
type WithoutTriggerConfirmDialogProps = {
  type: "without-trigger";
  children: JSX.Element;
};
export default function ConfirmDialog(props: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const isWithTrigger = props.type === "with-trigger";
  const { title, description, loading, confirmProps } = props;
  const { closeAfterConfirm, onConfirm, ...confirmButtonProps } =
    confirmProps || {};
  return (
    <Dialog
      open={open || loading || isConfirming}
      onOpenChange={(newOpen) => {
        if (!loading && !isConfirming) {
          setOpen(newOpen);
        }
      }}
    >
      <DialogTrigger asChild>
        {isWithTrigger ? (
          <Button
            type="button"
            {...props.triggerProps}
            className={cn("w-full", props.triggerProps.className)}
            onClick={(e) => {
              setOpen(true);
              if (props.triggerProps?.onClick) props.triggerProps.onClick(e);
            }}
          >
            {props.triggerProps.children || props.triggerProps.label}
          </Button>
        ) : (
          props.children
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            <span>{description}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {loading || isConfirming ? (
            <Skeleton className="w-20 h-9" />
          ) : (
            <DialogClose asChild disabled={loading || isConfirming}>
              <Button
                variant="outline"
                type="button"
                {...props.closeProps}
                disabled={loading || isConfirming}
              >
                {props.closeProps?.children ||
                  props.closeProps?.label ||
                  "Cancel"}
              </Button>
            </DialogClose>
          )}
          {loading || isConfirming ? (
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
                  setIsConfirming(true);
                  await onConfirm();
                  setIsConfirming(false);
                  if (closeAfterConfirm) setOpen(false);
                }
              }}
            >
              {props.confirmProps?.children ||
                props.confirmProps?.label ||
                "Confirm"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
