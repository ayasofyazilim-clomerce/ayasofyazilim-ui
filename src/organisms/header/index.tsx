import React from 'react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';

import AvatarWrapper from '../../molecules/avatar';

interface DashboardHeaderProps {
  // heading: string
  // text?: string
  children?: React.ReactNode;
}

export default function DashboardHeader({ children }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 w-100">
      <div className="flex justify-center align-center items-center">
        <AvatarWrapper text="UR" url="" />
        <span className="ml-2"> Unirefund </span>
      </div>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink>Settings</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink>Tickets</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink>Others</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex items-center gap-2">
        <input type="text" placeholder="Search" className="rounded-md p-2" />
        {children}
      </div>
      <AvatarWrapper text="AY" url="" />
    </div>
  );
}
