import { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { TwoColumnLayout } from '.';

export default {
  component: TwoColumnLayout,
  argTypes: {},
} as Meta<typeof TwoColumnLayout>;

const Template: StoryFn<typeof TwoColumnLayout> = (args) => (
  <TwoColumnLayout {...args} />
);

export const TwoColumnLayoutTemplate = Template.bind({});

const LeftNode = (
  <div className="bg-zinc-800 flex flex-auto">
    <div>
      <img src="https://i.imgur.com/z5WQB9B.png" alt="logo" />
    </div>
  </div>
);
const RightNode = (
  <div className="bg-red-800 flex flex-auto">
    <div>
      <img src="https://i.imgur.com/z5WQB9B.png" alt="logo" />
    </div>
  </div>
);
TwoColumnLayoutTemplate.args = {
  LeftNode,
  RightNode,
};
