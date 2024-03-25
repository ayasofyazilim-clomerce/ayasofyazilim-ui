import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Mainlayout from './index';

export default {
  component: Mainlayout,
  argTypes: {},
} as Meta<typeof Mainlayout>;

const Template: StoryFn<typeof Mainlayout> = () => <Mainlayout />;

export const MainLayoutTemplate = Template.bind({});

MainLayoutTemplate.args = {};
