import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

/**
 * Badge Component Stories
 * Visual regression tests for badge variants
 */
const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
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
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default badge
export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

// Betting status badges
export const BettingStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Pending</Badge>
      <Badge className="bg-green-500 hover:bg-green-600">Won</Badge>
      <Badge variant="destructive">Lost</Badge>
      <Badge variant="secondary">Push</Badge>
    </div>
  ),
};

// Confidence badges
export const ConfidenceLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-red-500 hover:bg-red-600">Low (30%)</Badge>
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Medium (55%)</Badge>
      <Badge className="bg-green-500 hover:bg-green-600">High (75%)</Badge>
      <Badge className="bg-emerald-500 hover:bg-emerald-600">Very High (90%)</Badge>
    </div>
  ),
};

// League badges
export const LeagueBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="border-orange-500 text-orange-500">NBA</Badge>
      <Badge variant="outline" className="border-green-500 text-green-500">NFL</Badge>
      <Badge variant="outline" className="border-blue-500 text-blue-500">MLB</Badge>
      <Badge variant="outline" className="border-cyan-500 text-cyan-500">NHL</Badge>
      <Badge variant="outline" className="border-purple-500 text-purple-500">NCAAB</Badge>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>
        <span className="mr-1">🔥</span> Hot Pick
      </Badge>
      <Badge variant="secondary">
        <span className="mr-1">⭐</span> Featured
      </Badge>
      <Badge variant="outline">
        <span className="mr-1">📈</span> Trending
      </Badge>
    </div>
  ),
};

// Sizes (using custom classes)
export const CustomSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge className="text-xs px-1.5 py-0">XS</Badge>
      <Badge className="text-sm">Small</Badge>
      <Badge className="text-base px-3 py-1">Medium</Badge>
      <Badge className="text-lg px-4 py-1.5">Large</Badge>
    </div>
  ),
};

// Pill badges
export const PillBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="rounded-full">Pill Badge</Badge>
      <Badge variant="secondary" className="rounded-full">Secondary</Badge>
      <Badge variant="outline" className="rounded-full">Outline</Badge>
    </div>
  ),
};

// Count badges
export const CountBadges: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="relative">
        <span className="text-sm">Notifications</span>
        <Badge className="absolute -top-2 -right-6 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
          5
        </Badge>
      </div>
      <div className="relative">
        <span className="text-sm">Messages</span>
        <Badge variant="destructive" className="absolute -top-2 -right-6 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
          12
        </Badge>
      </div>
    </div>
  ),
};
