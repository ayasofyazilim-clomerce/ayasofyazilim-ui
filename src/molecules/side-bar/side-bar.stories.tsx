import React from 'react';
import { Meta, StoryFn } from '@storybook/react';

import { SidebarMenu } from '../side-bar/index';

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

export const VerticalMenuStory = Template.bind({});

VerticalMenuStory.args = {};
