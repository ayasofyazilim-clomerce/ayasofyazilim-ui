import { Meta, StoryObj } from '@storybook/react';

import Navigation from '.';
import { navigationLinks } from './data';

export default { component: Navigation } as Meta<typeof Navigation>;

export const Default: StoryObj<typeof Navigation> = {
  args: {
    navigationLinks,
  },
  parameters: {
    layout: 'centered',
  },
};
