import React from 'react';

import DashboardHeader from '../../organisms/header';
import Sidebar from '../../molecules/side-bar/index';

export type mainLayoutProps = {
  logo: string;
  title: string;
};

export default function Mainlayout() {
  // porps: DashboardProps
  return (
    <>
      <DashboardHeader />
      <Sidebar />
    </>
  );
}
