import { Meta, StoryObj } from '@storybook/react';

import { Cat, Dog, Fish, Rabbit, Turtle } from 'lucide-react';
import { MultiSelect } from '.';

const frameworksList = [
  { value: 'react', label: 'React', icon: Turtle },
  { value: 'angular', label: 'Angular', icon: Cat },
  { value: 'vue', label: 'Vue', icon: Dog },
  { value: 'svelte', label: 'Svelte', icon: Rabbit },
  { value: 'ember', label: 'Ember', icon: Fish },
];

export default { component: MultiSelect } as Meta<typeof MultiSelect>;

export const Default: StoryObj<typeof MultiSelect> = {
  args: {
    options: frameworksList,
    // onValueChange: console.log,
    defaultValue: ['react'],
    placeholder: 'Select frameworks',
    variant: 'inverted',
    animation: 0,
    maxCount: 3,
    modalPopover: false,
  },
  parameters: {
    layout: 'centered',
  },
};
