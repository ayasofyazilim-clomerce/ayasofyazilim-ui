import React from 'react';
import { Meta, StoryFn } from '@storybook/react';

import SidebarMenu from './index';
import { exampleMenus } from './data';

export default {
  component: SidebarMenu,
  argTypes: {},
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof SidebarMenu>;

const Template: StoryFn<typeof SidebarMenu> = (args) => (
  <SidebarMenu {...args} />
);

export const SidebarMenuStory = Template.bind({});

SidebarMenuStory.args = {
  menus: exampleMenus,
};
