import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ayasofyazilim-ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@repo/ayasofyazilim-ui/components/empty";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { ReactNode } from "react";
import { EmptyConfig } from ".";

export type CardClassNames = {
  container?: string;
  header?: string;
  content?: string;
  title?: string;
  description?: string;
  footer?: string;
  isEmpty?: string;
};

export function ChartCard({
  title,
  description,
  period,
  header,
  footer,
  trendText,
  trendIcon,
  children,
  classNames,
  emptyState,
}: {
  title?: ReactNode;
  description?: ReactNode;
  period?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  trendText?: ReactNode;
  trendIcon?: ReactNode;
  children: ReactNode;
  classNames?: CardClassNames;
} & Partial<EmptyConfig>) {
  return (
    <Card className={cn(classNames?.container)}>
      <CardHeader
        className={cn("items-center pb-4! grid-rows-1", classNames?.header)}
      >
        {title && (
          <CardTitle className={cn("my-auto", classNames?.title)}>
            {title}
          </CardTitle>
        )}
        {period && (
          <CardDescription className={cn(classNames?.description)}>
            {period}
          </CardDescription>
        )}
        {description && (
          <CardDescription className={cn(classNames?.description)}>
            {description}
          </CardDescription>
        )}
        {header}
      </CardHeader>
      <CardContent className={cn("pb-0 relative", classNames?.content)}>
        {emptyState && <div className="absolute inset-0 bg-white/50 z-2">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {emptyState.icon}
              </EmptyMedia>
              <EmptyTitle>{emptyState.title}</EmptyTitle>
              <EmptyDescription>
                {emptyState.description}
              </EmptyDescription>
            </EmptyHeader>
          </Empty></div>}
        {children}
      </CardContent>
      {(trendText || trendIcon) && (
        <CardFooter
          className={cn(
            "flex items-center gap-2 leading-none font-medium",
            classNames?.footer
          )}
        >
          {trendText} {trendIcon}
        </CardFooter>
      )}
      {footer && (
        <CardFooter className={cn(classNames?.footer)}>{footer}</CardFooter>
      )}
    </Card>
  );
}