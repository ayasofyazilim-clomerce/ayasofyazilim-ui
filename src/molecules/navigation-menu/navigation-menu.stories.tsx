import { Meta, StoryObj } from '@storybook/react';

import Navigation from '.';

export default { component: Navigation } as Meta<typeof Navigation>;

export const Default: StoryObj<typeof Navigation> = {
  args: {},
  parameters: {
    layout: 'centered',
  },
};
