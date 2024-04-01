import React from 'react';
import Link from 'next/link';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../@/components/ui/avatar';
import { Button } from '../../../@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../../../@/components/ui/dropdown-menu';

type menuLinkTypes = {
  href: string;
  shortcut?: string;
  text: string;
};

export type userNavTypes = {
  email?: string;
  imageURL?: string;
  initials?: string;
  logoutFunction?: () => void;
  menuLinks?: menuLinkTypes[];
  username?: string;
};

export const UserNav = (props: userNavTypes) => {
  const initials =
    props.initials || props.username?.substring(0, 2).toUpperCase() || 'TR';

  function menuLinks(links: menuLinkTypes[] | undefined) {
    if (links) {
      const menu = links.map((link) => (
        <Link
          key={`usernavmenu-${link.href}`}
          href={link.href}
          className="hover:cursor cursor-pointer hover:bg-gray-100"
        >
          <DropdownMenuItem className="hover:cursor cursor-pointer hover:bg-gray-100">
            {link.text}
            <DropdownMenuShortcut>{link.shortcut}</DropdownMenuShortcut>
          </DropdownMenuItem>
        </Link>
      ));
      return <DropdownMenuGroup> {menu} </DropdownMenuGroup>;
    }

    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={props.imageURL} alt={`@${props.username}`} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {props.username || 'username empty'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {props.email || 'email empty'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuLinks(props.menuLinks)}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="hover:cursor cursor-pointer hover:bg-gray-100"
          onClick={() => {
            if (props.logoutFunction) {
              props.logoutFunction();
            }
          }}
        >
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
