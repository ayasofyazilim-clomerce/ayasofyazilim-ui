'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export type sheetProps = {
  children?: React.ReactNode;
  className?: string;
  description?: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  title?: string;
  trigger: string | React.ReactNode;
};

export default function SheetSide(props: sheetProps) {
  return (
    <Sheet>
      <SheetTrigger className={props.className}>{props.trigger}</SheetTrigger>
      <SheetContent side={props.position} className="h-full">
        <SheetHeader>
          <SheetTitle>{props.title}</SheetTitle>
          <SheetDescription>{props.description}</SheetDescription>
        </SheetHeader>
        {props.children}
      </SheetContent>
    </Sheet>
  );
}
