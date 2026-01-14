import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';
import { Label } from './label';

/**
 * Checkbox Component Stories
 * Visual regression tests for checkbox variants and states
 */
const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
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

// Default checkbox
export const Default: Story = {
  args: {},
};

// With label
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

// Checked state
export const Checked: Story = {
  args: {
    checked: true,
  },
};

// Disabled
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled" className="text-muted-foreground">
          Disabled unchecked
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-checked" disabled checked />
        <Label htmlFor="disabled-checked" className="text-muted-foreground">
          Disabled checked
        </Label>
      </div>
    </div>
  ),
};

// Checkbox group
export const CheckboxGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Select leagues to follow:</h4>
      <div className="flex flex-col gap-3">
        <div className="flex items-center space-x-2">
          <Checkbox id="nba" defaultChecked />
          <Label htmlFor="nba">NBA</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="nfl" defaultChecked />
          <Label htmlFor="nfl">NFL</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="mlb" />
          <Label htmlFor="mlb">MLB</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="nhl" />
          <Label htmlFor="nhl">NHL</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="ncaab" />
          <Label htmlFor="ncaab">NCAAB</Label>
        </div>
      </div>
    </div>
  ),
};

// Notification preferences
export const NotificationPreferences: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      <h4 className="text-sm font-medium">Email Notifications</h4>
      <div className="flex flex-col gap-3">
        <div className="flex items-start space-x-2">
          <Checkbox id="predictions" defaultChecked className="mt-1" />
          <div>
            <Label htmlFor="predictions">New Predictions</Label>
            <p className="text-xs text-muted-foreground">
              Get notified when new high-confidence picks are available
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox id="results" defaultChecked className="mt-1" />
          <div>
            <Label htmlFor="results">Game Results</Label>
            <p className="text-xs text-muted-foreground">
              Receive updates when your bets are settled
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox id="sharp" className="mt-1" />
          <div>
            <Label htmlFor="sharp">Sharp Money Alerts</Label>
            <p className="text-xs text-muted-foreground">
              Get alerted about significant line movements
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox id="weekly" className="mt-1" />
          <div>
            <Label htmlFor="weekly">Weekly Summary</Label>
            <p className="text-xs text-muted-foreground">
              Receive a weekly performance report
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};

// Filter checkboxes
export const FilterCheckboxes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="high-conf" defaultChecked />
        <Label htmlFor="high-conf">High Confidence</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="value" />
        <Label htmlFor="value">Value Bets</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="sharp" />
        <Label htmlFor="sharp">Sharp Picks</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="live" />
        <Label htmlFor="live">Live Games</Label>
      </div>
    </div>
  ),
};

// Indeterminate state
export const WithIndeterminate: Story = {
  render: () => {
    const [checked, setChecked] = React.useState<boolean | 'indeterminate'>('indeterminate');
    
    return (
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="indeterminate" 
          checked={checked} 
          onCheckedChange={(value) => setChecked(value as boolean | 'indeterminate')}
        />
        <Label htmlFor="indeterminate">
          Select All ({checked === true ? 'all' : checked === 'indeterminate' ? 'some' : 'none'})
        </Label>
      </div>
    );
  },
};

import React from 'react';
