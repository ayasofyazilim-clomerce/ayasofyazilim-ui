import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button, ButtonProps } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export type ConfirmDialogProps = {
  closeProps?: ButtonProps;
  confirmProps?: ButtonProps & {
    closeAfterConfirm?: boolean;
    onConfirm?: () => void | Promise<void>;
  };
  description: string;
  loading?: boolean;
  title: string;
} & (WithTriggerConfirmDialogProps | WithoutTriggerConfirmDialogProps);
type WithTriggerConfirmDialogProps = {
  triggerProps: ButtonProps;
  type: 'with-trigger';
};
type WithoutTriggerConfirmDialogProps = {
  isOpen: boolean;
  type: 'without-trigger';
};
export default function ConfirmDialog(props: ConfirmDialogProps) {
  const [open, setOpen] = useState(
    props.type === 'without-trigger' ? props.isOpen : false
  );
  const isWithTrigger = props.type === 'with-trigger';
  const { title, description, loading } = props;
  return (
    <Dialog open={loading ? true : open} onOpenChange={setOpen}>
      {isWithTrigger ? (
        <DialogTrigger asChild>
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
        </DialogTrigger>
      ) : null}
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
                {props.closeProps?.children || 'Cancel'}
              </Button>
            </DialogClose>
          )}
          {loading ? (
            <Skeleton className="w-20 h-9" />
          ) : (
            <Button
              type="button"
              {...props.confirmProps}
              onClick={async (e) => {
                if (props.confirmProps?.onClick) {
                  props.confirmProps.onClick(e);
                }
                if (props.confirmProps?.onConfirm) {
                  await props.confirmProps.onConfirm();
                  if (props.confirmProps?.closeAfterConfirm) setOpen(false);
                }
              }}
            >
              {props.confirmProps?.children || 'Confirm'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
