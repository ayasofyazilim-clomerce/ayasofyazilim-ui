import React from 'react';
import { Meta, StoryFn } from '@storybook/react';

import SidebarMenu from './index';

export default {
  component: SidebarMenu,
  argTypes: {},
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof SidebarMenu>;

const Template: StoryFn<typeof SidebarMenu> = () => <SidebarMenu />;

export const SidebarMenuStory = Template.bind({});

SidebarMenuStory.args = {};
