import { Meta, StoryObj } from '@storybook/react';

import Dashbaord from '.';
import { data } from '../../molecules/tables/data';
import { columns } from '../../molecules/tables/columns';
import { cards } from '../../organisms/card-list/data';

export default {
  title: 'Templates/dashboard',
  component: Dashbaord,
  args: {
    showCards: true,
    showTable: true,
    isLoading: false,
  },
} as Meta<typeof Dashbaord>;

// Default story with both Cards and Table shown
export const Default: StoryObj<typeof Dashbaord> = {
  args: {
    showCards: true,
    showTable: true,
    data,
    // @ts-ignore
    columnsData: {
      type: 'Custom',
      data: { columns },
    },
    cards,
  },
  parameters: {
    layout: 'full',
  },
};

// Only Cards displayed in the dashboard
export const OnlyCards: StoryObj<typeof Dashbaord> = {
  args: {
    showCards: true,
    showTable: false,
    cards,
  },
  parameters: {
    layout: 'centered',
  },
};

// Only Table displayed in the dashboard
export const OnlyTable: StoryObj<typeof Dashbaord> = {
  args: {
    showCards: false,
    showTable: true,
    data,
    // @ts-ignore
    columnsData: {
      type: 'Custom',
      data: { columns },
    },
  },
};
