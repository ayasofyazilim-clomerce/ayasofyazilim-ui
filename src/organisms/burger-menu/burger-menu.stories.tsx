import { Meta, StoryObj } from '@storybook/react';

import BurgerMenu from '.';
import { navigationLinks } from '../../molecules/navigation-menu/data';

export default { component: BurgerMenu } as Meta<typeof BurgerMenu>;

export const Default: StoryObj<typeof BurgerMenu> = {
  args: {
    navigationLinks,
  },
  parameters: {
    layout: 'centered',
  },
};
