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
  description?: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  title?: string;
  triggerText: string;
};

export default function SheetSide(props: sheetProps) {
  return (
    <Sheet>
      <SheetTrigger>{props.triggerText}</SheetTrigger>
      <SheetContent side={props.position}>
        <SheetHeader>
          <SheetTitle>{props.title}</SheetTitle>
          <SheetDescription>{props.description}</SheetDescription>
        </SheetHeader>
        {props.children}
      </SheetContent>
    </Sheet>
  );
}
