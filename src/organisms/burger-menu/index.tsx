'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import SheetSide from '../../molecules/sheet';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export type submenuTypes = {
  description: string;
  href: string;
  title: string;
};

export type navigationLinkTypes = {
  href?: string;
  submenu?: submenuTypes[];
  text?: string;
  title?: string;
};

export type NavigationProps = {
  className?: string;
  navigationLinks?: navigationLinkTypes[];
};

export default function BurgerMenu({
  navigationLinks,
  className,
}: NavigationProps) {
  return (
    <SheetSide
      className={className}
      trigger={<Menu />}
      position="left"
      title="Navigation"
      description="Enjoy this appp jourey"
    >
      <ScrollArea className="h-full">
        <ul className="grid gap-3 p-4">
          {navigationLinks?.map((link) => {
            if (link.submenu) {
              return (
                <ul className="grid gap-3 p-4" key={link.title || link.text}>
                  {link.submenu.map((submenu) => (
                    <ListItem
                      key={submenu.title}
                      title={submenu.title}
                      href={submenu.href}
                    >
                      {submenu.description}
                    </ListItem>
                  ))}
                </ul>
              );
            }
            return (
              <ListItem key={link.text} title={link.text} href={link.href}>
                {link.text}
              </ListItem>
            );
          })}
        </ul>
      </ScrollArea>
    </SheetSide>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => (
  <li>
    <Link
      ref={ref}
      className={cn(
        'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        className
      )}
      {...props}
    >
      <div className="text-sm font-medium leading-none">{title}</div>
      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
        {children}
      </p>
    </Link>
  </li>
));
ListItem.displayName = 'ListItem';
