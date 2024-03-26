import React from 'react';

import Navigation from '../../molecules/navigation-menu';
import AvatarWrapper from '../../molecules/avatar';
import { UserNav } from '../profile-menu/index';

interface DashboardHeaderProps {
  // heading: string
  // text?: string
  children?: React.ReactNode;
}

export default function DashboardHeader({ children }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 w-100">
      <AvatarWrapper text="UR" url="" sideText="Unirefund" />
      <Navigation />
      {children && <div className="flex items-center gap-2">{children}</div>}
      <UserNav />
    </div>
  );
}
