'use client';

import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

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
  navigationLinks?: navigationLinkTypes[];
};

export default function Navigation({
  navigationLinks,
}: {
  navigationLinks: navigationLinkTypes[];
}) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {navigationLinks?.map((link) => {
          if (link.submenu) {
            return (
              <NavigationMenuItem key={link.title}>
                <NavigationMenuTrigger>{link.title}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
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
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }
          return (
            <NavigationMenuItem key={link.href}>
              <Link href={link.href} passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  {link.text}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => (
  <li>
    <NavigationMenuLink asChild>
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
    </NavigationMenuLink>
  </li>
));
ListItem.displayName = 'ListItem';
