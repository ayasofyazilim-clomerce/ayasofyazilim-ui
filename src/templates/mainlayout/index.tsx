import React, { JSXElementConstructor, ReactElement } from 'react';
import { userNavTypes } from 'src/organisms/profile-menu';
import DashboardHeader from '../../organisms/header';
import Sidebar, { MenuProps } from '../../molecules/side-bar/index';
import { navigationLinkTypes } from '../../molecules/navigation-menu';

export type mainLayoutProps = {
  children?: ReactElement<any, string | JSXElementConstructor<any>> | String;
  extraMenu?: ReactElement | ReactElement;
  logo?: string;
  menus?: MenuProps[];
  navMenu: navigationLinkTypes[];
  title?: string;
  userNav?: userNavTypes;
};

export default function Mainlayout({
  logo,
  title,
  children,
  menus,
  userNav,
  navMenu,
  extraMenu,
}: mainLayoutProps) {
  // porps: DashboardProps
  return (
    <div className="h-dvh grid grid-rows-[max-content_1fr]">
      <DashboardHeader
        logo={logo}
        title={title}
        userNav={userNav}
        navMenu={navMenu}
        extraMenu={extraMenu}
      />
      <div className="flex">
        <Sidebar className="hidden md:flex" menus={menus} />
        <div className="flex-col w-full h-full">{children}</div>
      </div>
    </div>
  );
}
