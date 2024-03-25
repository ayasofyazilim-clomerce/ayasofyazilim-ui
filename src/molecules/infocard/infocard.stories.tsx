import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import InfoCard from '.';

export default {
  component: InfoCard,
  argTypes: {},
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof InfoCard>;

const Template: StoryFn<typeof InfoCard> = (args) => <InfoCard {...args} />;

export const InfoCardStory = Template.bind({});

InfoCardStory.args = {
  title: 'People',
  content: '15k',
  description: 'Number of people in the system',
  footer: 'Your target is 20K',
};
