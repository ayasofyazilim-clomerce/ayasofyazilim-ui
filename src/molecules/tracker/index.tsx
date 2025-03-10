'use client';

// Tremor Raw Tracker [v0.1.0]

import React from 'react';
import * as HoverCardPrimitives from '@radix-ui/react-hover-card';

import { cn } from '@/lib/utils';

interface TrackerBlockProps {
  color?: string;
  defaultBackgroundColor?: string;
  hoverEffect?: boolean;
  tooltip?: string;
}

const Block = ({
  color,
  tooltip,
  defaultBackgroundColor,
  hoverEffect,
}: TrackerBlockProps) => {
  const [open, setOpen] = React.useState(false);
  return (
    <HoverCardPrimitives.Root
      open={open}
      onOpenChange={setOpen}
      openDelay={0}
      closeDelay={0}
    >
      <HoverCardPrimitives.Trigger onClick={() => setOpen(true)} asChild>
        <div className="size-full overflow-hidden px-[0.5px] transition first:rounded-l-[4px] first:pl-0 last:rounded-r-[4px] last:pr-0 sm:px-px">
          <div
            className={cn(
              'size-full rounded-[1px]',
              color || defaultBackgroundColor,
              hoverEffect ? 'hover:opacity-50' : ''
            )}
          />
        </div>
      </HoverCardPrimitives.Trigger>
      <HoverCardPrimitives.Portal>
        <HoverCardPrimitives.Content
          sideOffset={10}
          side="top"
          align="center"
          avoidCollisions
          className={cn(
            // base
            'w-auto rounded-md px-2 py-1 text-sm shadow-md',
            // text color
            'text-white dark:text-gray-900',
            // background color
            'bg-gray-900 dark:bg-gray-50'
          )}
        >
          {tooltip}
        </HoverCardPrimitives.Content>
      </HoverCardPrimitives.Portal>
    </HoverCardPrimitives.Root>
  );
};

interface TrackerProps extends React.HTMLAttributes<HTMLDivElement> {
  data: TrackerBlockProps[];
  defaultBackgroundColor?: string;
  hoverEffect?: boolean;
}

const Tracker = React.forwardRef<HTMLDivElement, TrackerProps>(
  (
    {
      data = [],
      defaultBackgroundColor = 'bg-gray-400 dark:bg-gray-400',
      className,
      hoverEffect,
      ...props
    },
    forwardedRef
  ) => (
    <div
      ref={forwardedRef}
      className={cn('items-cente group flex h-8 w-full', className)}
      {...props}
    >
      {data.map((_props: TrackerBlockProps, index) => (
        <Block
          key={`item-${index.toString()}`}
          defaultBackgroundColor={defaultBackgroundColor}
          hoverEffect={hoverEffect}
          {..._props}
        />
      ))}
    </div>
  )
);

Tracker.displayName = 'Tracker';

export { Tracker, type TrackerBlockProps };
