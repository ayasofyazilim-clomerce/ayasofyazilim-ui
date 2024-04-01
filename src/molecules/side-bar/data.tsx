import React from 'react';

import { SquareStack, User } from 'lucide-react';
import { MenuProps } from '.';

export const exampleMenus: MenuProps[] = [
  {
    label: 'Pages',
    name: 'Profile',
    icon: <User size={15} className="mr-2" />,
    href: 'profile',
  },
  {
    label: 'Pages',
    name: 'Dashboard',
    icon: <SquareStack size={15} className="mr-2" />,
    href: 'dashboard',
  },
];
