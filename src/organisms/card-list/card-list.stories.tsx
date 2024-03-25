import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import CardList from '.';

export default {
  component: CardList,
  argTypes: {},
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof CardList>;

const Template: StoryFn<typeof CardList> = (args) => <CardList {...args} />;

export const CardListStory = Template.bind({});

CardListStory.args = {
  cards: [
    {
      title: 'Paid',
      content: '15%',
      description: 'Number of paid taxes',
      footer: 'Your target is 100%',
    },
    {
      title: 'People',
      content: '15k',
      description: 'Number of people in the system',
      footer: 'Your target is 20K',
    },
    {
      title: 'WIP',
      content: '1',
      description: 'Number of WIP refunds',
      footer: 'Your target is 0',
    },
  ],
};
