import { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type CardClassNames = {
  container?: string;
  header?: string;
  content?: string;
  title?: string;
  description?: string;
  footer?: string;
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
}) {
  return (
    <Card className={cn(classNames?.container)}>
      <CardHeader className={cn('items-center pb-4', classNames?.header)}>
        {title && (
          <CardTitle className={cn(classNames?.title)}>{title}</CardTitle>
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
      <CardContent className={cn('pb-0', classNames?.content)}>
        {children}
      </CardContent>
      {(trendText || trendIcon) && (
        <CardFooter
          className={cn(
            'flex items-center gap-2 leading-none font-medium',
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
