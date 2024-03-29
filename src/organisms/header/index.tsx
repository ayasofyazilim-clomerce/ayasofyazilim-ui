import React from 'react';

import Navigation from '../../molecules/navigation-menu';
import AvatarWrapper from '../../molecules/avatar';
import { UserNav, userNavTypes } from '../profile-menu/index';

interface DashboardHeaderProps {
  children?: React.ReactNode;
  logo?: string;
  title?: string;
  userNav?: userNavTypes;
}

export default function DashboardHeader({
  children,
  title,
  logo,
  userNav,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 w-100">
      <AvatarWrapper text="UR" url={logo} sideText={title} />
      <Navigation />
      {children && <div className="flex items-center gap-2">{children}</div>}
      <UserNav {...userNav} />
    </div>
  );
}
