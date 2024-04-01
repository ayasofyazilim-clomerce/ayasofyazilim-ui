import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Mainlayout from './index';
import { navigationLinks } from '../../molecules/navigation-menu/data';
import { exampleMenus } from '../../molecules/side-bar/data';
import { userNavigation } from '../../organisms/profile-menu/data';

export default {
  component: Mainlayout,
  argTypes: {},
} as Meta<typeof Mainlayout>;

const Template: StoryFn<typeof Mainlayout> = (args) => <Mainlayout {...args} />;

export const MainLayoutTemplate = Template.bind({});

MainLayoutTemplate.args = {
  logo: 'https://github.com/ayasofyazilim-clomerce.png',
  title: 'ayasofya',
  menus: exampleMenus,
  userNav: userNavigation,
  navMenu: navigationLinks,
};
