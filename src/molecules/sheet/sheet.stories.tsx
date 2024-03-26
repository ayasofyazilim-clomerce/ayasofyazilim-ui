import { Meta, StoryObj } from '@storybook/react';

import Sheet from '.';

export default { component: Sheet } as Meta<typeof Sheet>;

export const Default: StoryObj<typeof Sheet> = {
  args: {
    position: 'top',
    triggerText: 'Open sheet',
    title: 'Sheet title',
    description: 'Sheet description',
  },
  parameters: {
    layout: 'centered',
  },
};
