import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import DashboardHeader from '.';

export default {
  component: DashboardHeader,
  argTypes: {},
} as Meta<typeof DashboardHeader>;

const Template: StoryFn<typeof DashboardHeader> = (args) => (
  <DashboardHeader {...args} />
);

export const HeaderStory = Template.bind({});

HeaderStory.args = {
  // heading: 'header',
  // text: 'test',
};
