import React from 'react';
import { Meta, StoryFn } from '@storybook/react';

import { VerticalMenu, VerticalMenuProps } from '../vertical-menu/index';

const testData: VerticalMenuProps = {
  items: [
    {
      title: 'Home',
      href: '/home',
      disabled: false,
      external: false,
      icon: 'home-icon',
      label: 'home-label',
      description: 'This is home page',
    },
    {
      title: 'About',
      href: '/about',
      disabled: false,
      external: false,
      icon: 'about-icon',
      label: 'about-label',
      description: 'This is about page',
    },
    {
      title: 'Contact',
      href: '/contact',
      disabled: true,
      external: true,
      icon: 'contact-icon',
      label: 'contact-label',
      description: 'This is contact page',
    },
  ],
  setOpen: () => {},
  path: '/home',
};

export default {
  component: VerticalMenu,
  argTypes: {},
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof VerticalMenu>;

const Template: StoryFn<typeof VerticalMenu> = (args) => (
  <VerticalMenu {...args} />
);

export const VerticalMenuStory = Template.bind({});

VerticalMenuStory.args = {
  ...testData,
};
