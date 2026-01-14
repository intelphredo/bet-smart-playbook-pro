import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Label } from './label';

/**
 * Input Component Stories
 * Visual regression tests for input variants and states
 */
const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    chromatic: {
      viewports: [375, 1280],
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark' },
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default input
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

// With label
export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

// Different types
export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
    </div>
  ),
};

// States
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Input placeholder="Default" />
      <Input placeholder="With value" defaultValue="Hello World" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Read only" readOnly defaultValue="Read only value" />
    </div>
  ),
};

// With error styling (custom)
export const WithError: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="error-input">Email</Label>
      <Input 
        id="error-input"
        type="email" 
        placeholder="Email" 
        className="border-red-500 focus-visible:ring-red-500"
        defaultValue="invalid-email"
      />
      <p className="text-sm text-red-500">Please enter a valid email address</p>
    </div>
  ),
};

// Focus state for Chromatic
export const FocusState: Story = {
  parameters: {
    pseudo: {
      focus: ['input'],
    },
  },
  args: {
    placeholder: 'Focused input',
  },
};
