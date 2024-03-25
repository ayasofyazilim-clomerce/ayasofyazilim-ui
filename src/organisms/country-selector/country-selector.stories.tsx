import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import { CountrySelector as CS } from '.';

export default {
  component: CS,
  argTypes: {},
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof CS>;

const Template: StoryFn<typeof CS> = (args) => <CS {...args} />;

export const CountrySelector = Template.bind({});

CountrySelector.args = {
  searchText: 'Find',
  searchEmptyValue: 'No country found.',
  defaultValue: {
    label: 'Test',
    value: 'tr',
  },
  countries: [
    {
      value: 'tr',
      label: 'Türkçe',
    },
    {
      value: 'it',
      label: 'Italiano',
    },
    {
      value: 'jp',
      label: '日本語',
    },
    {
      value: 'sa',
      label: 'عربي',
      rtl: true,
    },
  ],
};
