import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import Dashboard from '.';

export default {
  component: Dashboard,
  argTypes: {},
} as Meta<typeof Dashboard>;

const Template: StoryFn<typeof Dashboard> = () => <Dashboard />;

export const DashboardTemplate = Template.bind({});

DashboardTemplate.args = {};
