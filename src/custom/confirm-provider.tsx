"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ayasofyazilim-ui/components/alert-dialog";
import { buttonVariants } from "@repo/ayasofyazilim-ui/components/button";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export type ConfirmOptions = {
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
};

export type ConfirmProviderProps = {
  children: React.ReactNode;
  labels?: { confirm?: string; cancel?: string };
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children, labels }: ConfirmProviderProps) {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const [open, setOpen] = React.useState(false);
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const settle = React.useCallback((value: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(value);
  }, []);

  const confirm = React.useCallback<ConfirmFn>(
    (next) => {
      // A newer request supersedes an open one: the older one is declined.
      settle(false);
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        setOptions(next);
        setOpen(true);
      });
    },
    [settle]
  );

  // Never leave a caller awaiting forever if the provider goes away.
  React.useEffect(() => () => settle(false), [settle]);

  const close = (value: boolean) => {
    settle(value);
    // Keep the last options mounted so the exit animation can play.
    setOpen(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(open) => {
          if (!open) close(false);
        }}
      >
        {options && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{options.title}</AlertDialogTitle>
              {options.description !== undefined && (
                <AlertDialogDescription>
                  {options.description}
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => close(false)}>
                {options.cancelLabel ?? labels?.cancel ?? "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                className={cn(
                  buttonVariants({ variant: options.variant ?? "default" })
                )}
                onClick={() => close(true)}
              >
                {options.confirmLabel ?? labels?.confirm ?? "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const confirm = React.useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>");
  }
  return confirm;
}
