import React, { JSXElementConstructor, ReactElement } from 'react';
import { userNavTypes } from 'src/organisms/profile-menu';
import DashboardHeader from '../../organisms/header';
import Sidebar, { MenuProps } from '../../molecules/side-bar/index';

export type mainLayoutProps = {
  children: ReactElement<any, string | JSXElementConstructor<any>>;
  logo?: string;
  menus?: MenuProps[];
  title?: string;
  userNav?: userNavTypes;
};

// display: grid;
// grid-template-rows: max-content 1fr;
// height: 100dvh;
export default function Mainlayout({
  logo,
  title,
  children,
  menus,
  userNav,
}: mainLayoutProps) {
  // porps: DashboardProps
  return (
    <>
      <DashboardHeader logo={logo} title={title} userNav={userNav} />
      <div className="flex">
        <Sidebar menus={menus} />
        <div className="flex-col w-full h-full">{children}</div>
      </div>
    </>
  );
}
