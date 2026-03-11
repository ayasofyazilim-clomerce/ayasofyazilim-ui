import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-red-300 dark:border-red-900 bg-red-100 text-red-500 [a&]:hover:bg-red-900/90 focus-visible:ring-red-100/20 dark:focus-visible:ring-red-900/40 dark:bg-red-900/60",
        warning:
          "border-amber-300 dark:border-amber-900 bg-amber-100 text-amber-500 [a&]:hover:bg-amber-900/90 focus-visible:ring-amber-100/20 dark:focus-visible:ring-amber-900/40 dark:bg-amber-900/60",
        info: "border-blue-300 dark:border-blue-900 bg-blue-100 text-blue-500 [a&]:hover:bg-blue-900/90 focus-visible:ring-blue-100/20 dark:focus-visible:ring-blue-900/40 dark:bg-blue-900/60",
        success:
          "border-green-300 dark:border-green-900 bg-green-100 text-green-500 [a&]:hover:bg-green-900/90 focus-visible:ring-green-100/20 dark:focus-visible:ring-green-900/40 dark:bg-green-900/60",
        gray: "border-gray-300 dark:border-gray-600 bg-gray-100 text-gray-500 [a&]:hover:bg-gray-900/90 focus-visible:ring-gray-100/20 dark:focus-visible:ring-gray-900/40 dark:bg-gray-800/60",
        purple:
          "border-purple-300 dark:border-purple-900 bg-purple-100 text-purple-500 [a&]:hover:bg-purple-900/90 focus-visible:ring-purple-100/20 dark:focus-visible:ring-purple-900/40 dark:bg-purple-900/60",
        emerald:
          "border-emerald-300 dark:border-emerald-900 bg-emerald-100 text-emerald-500 [a&]:hover:bg-emerald-900/90 focus-visible:ring-emerald-100/20 dark:focus-visible:ring-emerald-900/40 dark:bg-emerald-900/60",
        cyan: "border-cyan-300 dark:border-cyan-900 bg-cyan-100 text-cyan-500 [a&]:hover:bg-cyan-900/90 focus-visible:ring-cyan-100/20 dark:focus-visible:ring-cyan-900/40 dark:bg-cyan-900/60",
        orange:
          "border-orange-300 dark:border-orange-900 bg-orange-100 text-orange-500 [a&]:hover:bg-orange-900/90 focus-visible:ring-orange-100/20 dark:focus-visible:ring-orange-900/40 dark:bg-orange-900/60",
        lime: "border-lime-300 dark:border-lime-900 bg-lime-100 text-lime-500 [a&]:hover:bg-lime-900/90 focus-visible:ring-lime-100/20 dark:focus-visible:ring-lime-900/40 dark:bg-lime-900/60",
        teal: "border-teal-300 dark:border-teal-900 bg-teal-100 text-teal-500 [a&]:hover:bg-teal-900/90 focus-visible:ring-teal-100/20 dark:focus-visible:ring-teal-900/40 dark:bg-teal-900/60",
        blue: "border-blue-300 dark:border-blue-900 bg-blue-100 text-blue-500 [a&]:hover:bg-blue-900/90 focus-visible:ring-blue-100/20 dark:focus-visible:ring-blue-900/40 dark:bg-blue-900/60",
        indigo:
          "border-indigo-300 dark:border-indigo-900 bg-indigo-100 text-indigo-500 [a&]:hover:bg-indigo-900/90 focus-visible:ring-indigo-100/20 dark:focus-visible:ring-indigo-900/40 dark:bg-indigo-900/60",
        pink: "border-pink-300 dark:border-pink-900 bg-pink-100 text-pink-500 [a&]:hover:bg-pink-900/90 focus-visible:ring-pink-100/20 dark:focus-visible:ring-pink-900/40 dark:bg-pink-900/60",
        rose: "border-rose-300 dark:border-rose-900 bg-rose-100 text-rose-500 [a&]:hover:bg-rose-900/90 focus-visible:ring-rose-100/20 dark:focus-visible:ring-rose-900/40 dark:bg-rose-900/60",

        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
      size: {
        sm: "px-1 py-0.1 text-[10px]",
        md: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
export { Badge, badgeVariants };
