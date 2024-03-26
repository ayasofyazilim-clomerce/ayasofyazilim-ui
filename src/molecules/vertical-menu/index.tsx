'use client';

import React, { Dispatch, SetStateAction } from 'react';

import { cn } from '@/lib/utils';

export interface NavItem {
  description?: string;
  disabled?: boolean;
  external?: boolean;
  href?: string;
  icon?: string;
  label?: string;
  title: string;
}

export interface VerticalMenuProps {
  items: NavItem[];
  path: string;
  setOpen?: Dispatch<SetStateAction<boolean>>;
}

export default function VerticalMenu({
  items,
  setOpen,
  path,
}: VerticalMenuProps) {
  if (!items?.length) {
    return null;
  }

  return (
    <nav className="grid items-start gap-2">
      {items.map(
        (item) =>
          // let iconName = item.icon || "ArrowRight";
          // const Icon = icons[iconName];
          item.href && (
            <a
              key={item.title}
              href={item.disabled ? '/' : item.href}
              onClick={() => {
                if (setOpen) setOpen(false);
              }}
            >
              <span
                className={cn(
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                  path === item.href ? 'bg-accent' : 'transparent',
                  item.disabled && 'cursor-not-allowed opacity-80'
                )}
              >
                {/* <Icon className="mr-2 h-4 w-4" /> */}
                <span>{item.title}</span>
              </span>
            </a>
          )
      )}
    </nav>
  );
}
