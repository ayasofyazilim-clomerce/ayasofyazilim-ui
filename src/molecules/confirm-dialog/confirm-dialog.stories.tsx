import { Meta, StoryFn } from '@storybook/react';
import ConfirmDialog from '.';

export default {
  title: 'Molecules/confirm-dialog',
  component: ConfirmDialog,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    loading: { control: 'boolean' },
    type: {
      control: 'radio',
      options: ['with-trigger', 'without-trigger'],
    },
  },
} as Meta;

const Template: StoryFn<typeof ConfirmDialog> = (args) => (
  <ConfirmDialog {...args} />
);

export const WithTrigger = Template.bind({});
WithTrigger.args = {
  type: 'with-trigger',
  title: 'Confirm Action',
  description: 'Are you sure you want to perform this action?',
  triggerProps: {
    children: 'Open Confirm Dialog',
  },
};

export const WithoutTriggerOpen = Template.bind({});
WithoutTriggerOpen.args = {
  type: 'without-trigger',
  isOpen: true,
  title: 'Confirm Action',
  description: 'Are you sure you want to perform this action?',
};

export const LoadingState = Template.bind({});
LoadingState.args = {
  type: 'without-trigger',
  isOpen: true,
  title: 'Confirm Action',
  description: 'Loading confirmation...',
  loading: true,
};

export const CustomActions = Template.bind({});
CustomActions.args = {
  type: 'with-trigger',
  title: 'Delete Item',
  description: 'Are you sure you want to delete this item?',
  triggerProps: {
    children: 'Delete Item',
  },
  confirmProps: {
    children: 'Delete',
    onConfirm: () => alert('Item Deleted'),
    closeAfterConfirm: true,
  },
  closeProps: {
    children: 'Cancel',
  },
};
