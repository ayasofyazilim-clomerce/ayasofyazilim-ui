import { StoryFn, Meta } from '@storybook/react';
import React from 'react';

import Infocard, { infoCardProps } from '.';

export default {
  component: Infocard,
  parameters: {
    layout: 'centered',
  },
  args: {
    content: '15000',
    description: 'your target',
    footer: 'You are doing well!',
    title: 'People',
    loading: 'boolean' as unknown as any,
  },
} as Meta<typeof Infocard>;

const Template: StoryFn<typeof Infocard> = (args: infoCardProps) => (
  <Infocard {...args} />
);

export const Default = Template.bind({});
