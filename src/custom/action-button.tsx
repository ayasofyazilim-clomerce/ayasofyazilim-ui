import {
  Button,
  buttonVariants,
} from "@repo/ayasofyazilim-ui/components/button";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { VariantProps } from "class-variance-authority";
import React, { ComponentType } from "react";

export function ActionList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "justify-end gap-2 rounded-md border p-2 has-[*]:flex hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ActionButton({
  loading,
  onClick,
  text,
  icon: Icon,
  variant = "outline",
}: {
  loading: boolean;
  onClick?: () => void;
  text: string;
  icon: ComponentType<{ className?: string }>;
  variant?: VariantProps<typeof buttonVariants>["variant"];
}) {
  return (
    <Button disabled={loading} onClick={onClick} variant={variant}>
      <Icon className="mr-2 size-4" />
      <span className="sr-only">{text}</span>
      <span className="sm:hidden md:block">{text}</span>
    </Button>
  );
}
