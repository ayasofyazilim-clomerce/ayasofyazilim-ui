"use client";

import { useState } from "react";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { Button } from "../../../../components/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../../../components/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "../../../../components/sheet";
import type { DialogRowAction } from "../../types";

interface DialogRowActionItemProps<TData> {
    action: DialogRowAction<TData>;
    row: TData;
    disabled?: boolean;
}

export function DialogRowActionItem<TData>({
    action,
    row,
    disabled,
}: DialogRowActionItemProps<TData>) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPreventClose, setIsPreventClose] = useState(
        action.preventClose ?? false
    );

    const setOpen = (open: boolean) => {
        if (!open && isPreventClose) return;
        setIsOpen(open);
        if (!open) {
            setIsPreventClose(action.preventClose ?? false);
        }
    };

    const setPreventClose = (prevent: boolean) => {
        setIsPreventClose(prevent);
    };

    const close = () => {
        setIsPreventClose(false);
        setIsOpen(false);
    };

    const label =
        typeof action.label === "function" ? action.label(row) : action.label;
    const title =
        typeof action.title === "function" ? action.title(row) : action.title;
    const description =
        typeof action.description === "function"
            ? action.description(row)
            : action.description;

    const Icon = action.icon;

    const interactionProps = {
        onPointerDownOutside: (e: Event) => {
            if (isPreventClose) e.preventDefault();
        },
        onEscapeKeyDown: (e: Event) => {
            if (isPreventClose) e.preventDefault();
        },
    };

    const triggerButton = (
        <Button
            variant={action.variant || "ghost"}
            disabled={disabled}
            className={cn("w-full justify-start", action.className)}
        >
            {Icon && <Icon className="size-3.5" />}
            {label}
        </Button>
    );

    const childrenContent = action.children({
        row,
        preventClose: isPreventClose,
        setPreventClose,
        close,
    });

    if (action.dialogType === "sheet") {
        return (
            <Sheet open={isOpen} onOpenChange={setOpen}>
                <SheetTrigger asChild>{triggerButton}</SheetTrigger>
                <SheetContent
                    className={action.contentClassName}
                    {...interactionProps}
                >
                    {(title || description) && (
                        <SheetHeader>
                            {title && <SheetTitle>{title}</SheetTitle>}
                            {description && (
                                <SheetDescription>{description}</SheetDescription>
                            )}
                        </SheetHeader>
                    )}
                    {childrenContent}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent
                className={cn("flex flex-col", action.contentClassName)}
                showCloseButton={action.showCloseButton}
                {...interactionProps}
            >
                {(title || description) && (
                    <DialogHeader>
                        {title && <DialogTitle>{title}</DialogTitle>}
                        {description && (
                            <DialogDescription>{description}</DialogDescription>
                        )}
                    </DialogHeader>
                )}
                {childrenContent}
            </DialogContent>
        </Dialog>
    );
}
