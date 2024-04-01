import React from 'react';
import { Meta, StoryFn } from '@storybook/react';

import { UserNav } from './index';
import { userNavigation } from './data';

export default {
  component: UserNav,
  argTypes: {},
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof UserNav>;

const Template: StoryFn<typeof UserNav> = () => <UserNav />;

export const Default = Template.bind({});

Default.args = {
  ...userNavigation,
};
