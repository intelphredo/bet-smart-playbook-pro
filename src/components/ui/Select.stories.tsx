import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from './select';
import { Label } from './label';

/**
 * Select Component Stories
 * Visual regression tests for select dropdowns
 */
const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
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

// Default select
export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

// With label
export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="league">League</Label>
      <Select>
        <SelectTrigger id="league" className="w-full">
          <SelectValue placeholder="Select league" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nba">NBA</SelectItem>
          <SelectItem value="nfl">NFL</SelectItem>
          <SelectItem value="mlb">MLB</SelectItem>
          <SelectItem value="nhl">NHL</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

// With groups
export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a sport" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>US Sports</SelectLabel>
          <SelectItem value="nba">NBA Basketball</SelectItem>
          <SelectItem value="nfl">NFL Football</SelectItem>
          <SelectItem value="mlb">MLB Baseball</SelectItem>
          <SelectItem value="nhl">NHL Hockey</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>College Sports</SelectLabel>
          <SelectItem value="ncaab">NCAAB Basketball</SelectItem>
          <SelectItem value="ncaaf">NCAAF Football</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>International</SelectLabel>
          <SelectItem value="soccer">Soccer</SelectItem>
          <SelectItem value="tennis">Tennis</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

// With selected value
export const WithSelectedValue: Story = {
  render: () => (
    <Select defaultValue="nba">
      <SelectTrigger className="w-[280px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="nba">NBA Basketball</SelectItem>
        <SelectItem value="nfl">NFL Football</SelectItem>
        <SelectItem value="mlb">MLB Baseball</SelectItem>
      </SelectContent>
    </Select>
  ),
};

// Disabled
export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Disabled select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
      </SelectContent>
    </Select>
  ),
};

// With disabled items
export const WithDisabledItems: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select bet type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="moneyline">Moneyline</SelectItem>
        <SelectItem value="spread">Spread</SelectItem>
        <SelectItem value="total">Over/Under</SelectItem>
        <SelectItem value="parlay" disabled>
          Parlay (Coming Soon)
        </SelectItem>
        <SelectItem value="teaser" disabled>
          Teaser (Coming Soon)
        </SelectItem>
      </SelectContent>
    </Select>
  ),
};

// Open state for Chromatic
export const OpenState: Story = {
  render: () => (
    <Select defaultOpen>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
        <SelectItem value="option4">Option 4</SelectItem>
      </SelectContent>
    </Select>
  ),
};

// Multiple selects in row
export const SelectRow: Story = {
  render: () => (
    <div className="flex gap-4">
      <Select defaultValue="nba">
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nba">NBA</SelectItem>
          <SelectItem value="nfl">NFL</SelectItem>
        </SelectContent>
      </Select>
      
      <Select defaultValue="spread">
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="moneyline">Moneyline</SelectItem>
          <SelectItem value="spread">Spread</SelectItem>
          <SelectItem value="total">Total</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
