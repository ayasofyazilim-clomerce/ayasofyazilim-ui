import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import ForgotPasswordForm, { defaultForgotPasswordFormSchema } from '.';
import locale from '../../../locale_tr.json';

export default {
  component: ForgotPasswordForm,
  argTypes: {},
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof ForgotPasswordForm>;

const template: StoryFn<typeof ForgotPasswordForm> = (args) => (
  <ForgotPasswordForm {...args} />
);
export const Default = template.bind({});
Default.args = {
  formSchema: defaultForgotPasswordFormSchema,
  resources: locale.resources,
};
