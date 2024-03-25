import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Avatar from '.';

export default {
  component: Avatar,
  argTypes: {},
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof Avatar>;

const template: StoryFn<typeof Avatar> = (args) => <Avatar {...args} />;
export const Default = template.bind({});
Default.args = {
  url: 'https://via.placeholder.com/150',
  text: 'Avatar',
};

export const EmptyUrl = template.bind({});
EmptyUrl.args = {
  text: 'AV',
};
