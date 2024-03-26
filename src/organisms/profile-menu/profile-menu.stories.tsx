import React from 'react';
import { Meta, StoryFn } from '@storybook/react';

import { UserNav } from './index';

export default {
  component: UserNav,
  argTypes: {},
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof UserNav>;

const Template: StoryFn<typeof UserNav> = (args) => <UserNav {...args} />;

export const Default = Template.bind({});

Default.args = {};
