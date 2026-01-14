import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

/**
 * Button Component Stories
 * Visual regression tests for button variants and states
 */
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
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
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default button
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

// All sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// Disabled state
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

// Loading state (with icon)
export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>
        <span className="mr-2">🚀</span>
        With Icon
      </Button>
      <Button variant="outline">
        <span className="mr-2">📧</span>
        Email
      </Button>
    </div>
  ),
};

// Interactive states for Chromatic
export const InteractiveStates: Story = {
  parameters: {
    pseudo: {
      hover: ['#hover-button'],
      focus: ['#focus-button'],
      active: ['#active-button'],
    },
  },
  render: () => (
    <div className="flex gap-4">
      <Button id="hover-button">Hover</Button>
      <Button id="focus-button">Focus</Button>
      <Button id="active-button">Active</Button>
    </div>
  ),
};
