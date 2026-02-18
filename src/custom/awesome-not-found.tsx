"use client";
import {
  ButtonProps,
  buttonVariants,
} from "@repo/ayasofyazilim-ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@repo/ayasofyazilim-ui/components/empty";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { motion } from "motion/react";
import Link from "next/link";

const PRIMARY_ORB_HORIZONTAL_OFFSET = 40;
const PRIMARY_ORB_VERTICAL_OFFSET = 20;

export function AwesomeNotFound({
  title = "404",
  description = "The page you are looking for does not exist.",
  actions = [],
}: {
  title?: string;
  description?: string;
  actions?: {
    label: string;
    href: string;
    variant?: ButtonProps["variant"];
    size?: ButtonProps["size"];
    icon?: React.ComponentType;
  }[];
}) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1),transparent_70%)] text-foreground">
      <div
        aria-hidden={true}
        className="-z-10 absolute inset-0 overflow-hidden"
      >
        <motion.div
          animate={{
            x: [
              0,
              PRIMARY_ORB_HORIZONTAL_OFFSET,
              -PRIMARY_ORB_HORIZONTAL_OFFSET,
              0,
            ],
            y: [
              0,
              PRIMARY_ORB_VERTICAL_OFFSET,
              -PRIMARY_ORB_VERTICAL_OFFSET,
              0,
            ],
            rotate: [0, 10, -10, 0],
          }}
          className="absolute top-1/2 left-1/3 size-90 rounded-full bg-linear-to-tr from-purple-500/20 to-blue-500/20 blur-3xl"
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 4,
            ease: "easeInOut",
          }}
        />
        <motion.div
          animate={{
            x: [
              0,
              -PRIMARY_ORB_HORIZONTAL_OFFSET,
              PRIMARY_ORB_HORIZONTAL_OFFSET,
              0,
            ],
            y: [
              0,
              -PRIMARY_ORB_VERTICAL_OFFSET,
              PRIMARY_ORB_VERTICAL_OFFSET,
              0,
            ],
          }}
          className="absolute right-1/4 bottom-1/3 size-120 rounded-full bg-linear-to-br from-indigo-400/10 to-pink-400/10 blur-3xl"
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 4,
            ease: "easeInOut",
          }}
        />
      </div>

      <Empty>
        <EmptyHeader>
          <EmptyTitle className="font-extrabold text-8xl">{title}</EmptyTitle>
          <EmptyDescription className="text-nowrap">
            {description}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            {actions.map((action) => (
              <Link
                href={action.href}
                className={cn(
                  buttonVariants({
                    variant: action.variant || "default",
                    size: action.size || "default",
                  }),
                )}
                key={action.label}
              >
                {action.icon && <action.icon />} {action.label}
              </Link>
            ))}
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
