import { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import AdvancedCalendar from '.';

export default {
  title: 'molecules/advanced-calendar',
  component: AdvancedCalendar,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    presets: {
      control: {
        type: 'boolean',
      },
    },
    fromYear: {
      control: { type: 'number', min: 1900, max: 2050 },
    },
    toYear: {
      control: { type: 'number', min: 1900, max: 2050 },
    },
    type: {
      control: 'inline-radio',
      options: ['buttons', 'dropdown', 'dropdown-buttons'],
    },
  },
  args: {
    presets: false,
    view: 'single',
    className: 'w-full',
    fromYear: new Date().getFullYear() - 5,
    toYear: new Date().getFullYear(),
    type: 'buttons',
  },
} as Meta<typeof AdvancedCalendar>;

export const Default: StoryObj<typeof AdvancedCalendar> = {
  args: {
    presets: true,
    view: 'single',
    toYear: 2025,
  },
  render: (args) => {
    const [filteredValue, setFilteredValue] = useState<string>('');
    return (
      <AdvancedCalendar
        {...args}
        initialFocus
        mode="single"
        onSelect={(value) => {
          setFilteredValue(value?.toISOString() || '');
        }}
        selected={filteredValue ? new Date(filteredValue) : undefined}
      />
    );
  },
};

export const MultipleView: StoryObj<typeof AdvancedCalendar> = {
  args: {
    presets: true,
    view: 'multiple',
    className: 'w-full',
    fromYear: 2019,
    toYear: 2025,
    type: 'buttons',
  },

  render: (args) => {
    const [filteredValue, setFilteredValue] = useState<string>('');
    return (
      <AdvancedCalendar
        {...args}
        initialFocus
        mode="single"
        onSelect={(value) => {
          setFilteredValue(value?.toISOString() || '');
        }}
        selected={filteredValue ? new Date(filteredValue) : undefined}
      />
    );
  },
};

export const NoPresets: StoryObj<typeof AdvancedCalendar> = {
  args: {
    presets: false,
    view: 'single',
    className: 'w-full',
    fromYear: 2019,
    toYear: 2025,
    type: 'buttons',
  },

  render: (args) => {
    const [filteredValue, setFilteredValue] = useState<string>('');
    return (
      <AdvancedCalendar
        {...args}
        initialFocus
        mode="single"
        onSelect={(value) => {
          setFilteredValue(value?.toISOString() || '');
        }}
        selected={filteredValue ? new Date(filteredValue) : undefined}
      />
    );
  },
};

export const Dropdown: StoryObj<typeof AdvancedCalendar> = {
  args: {
    presets: false,
    view: 'single',
    className: 'w-full',
    fromYear: 2019,
    toYear: 2025,
    type: 'dropdown',
  },

  render: (args) => {
    const [filteredValue, setFilteredValue] = useState<string>('');
    return (
      <AdvancedCalendar
        {...args}
        initialFocus
        mode="single"
        onSelect={(value) => {
          setFilteredValue(value?.toISOString() || '');
        }}
        selected={filteredValue ? new Date(filteredValue) : undefined}
      />
    );
  },
};

export const DropdownButtons: StoryObj<typeof AdvancedCalendar> = {
  args: {
    presets: false,
    view: 'single',
    className: 'w-full',
    fromYear: 2019,
    toYear: 2025,
    type: 'dropdown-buttons',
  },

  render: (args) => {
    const [filteredValue, setFilteredValue] = useState<string>('');
    return (
      <AdvancedCalendar
        {...args}
        initialFocus
        mode="single"
        onSelect={(value) => {
          setFilteredValue(value?.toISOString() || '');
        }}
        selected={filteredValue ? new Date(filteredValue) : undefined}
      />
    );
  },
};
