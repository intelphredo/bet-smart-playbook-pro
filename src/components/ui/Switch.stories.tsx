import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';
import { Label } from './label';

/**
 * Switch Component Stories
 * Visual regression tests for toggle switches
 */
const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
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

// Default switch
export const Default: Story = {
  args: {},
};

// With label
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
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
        <Switch id="disabled" disabled />
        <Label htmlFor="disabled" className="text-muted-foreground">
          Disabled off
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="disabled-on" disabled checked />
        <Label htmlFor="disabled-on" className="text-muted-foreground">
          Disabled on
        </Label>
      </div>
    </div>
  ),
};

// Settings panel
export const SettingsPanel: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <h4 className="font-medium">Notification Settings</h4>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="push">Push Notifications</Label>
            <p className="text-xs text-muted-foreground">
              Receive push notifications on your device
            </p>
          </div>
          <Switch id="push" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email">Email Notifications</Label>
            <p className="text-xs text-muted-foreground">
              Receive email updates about your bets
            </p>
          </div>
          <Switch id="email" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="sms">SMS Notifications</Label>
            <p className="text-xs text-muted-foreground">
              Get text messages for important alerts
            </p>
          </div>
          <Switch id="sms" />
        </div>
      </div>
    </div>
  ),
};

// Feature toggles
export const FeatureToggles: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <h4 className="font-medium">Display Settings</h4>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode">Dark Mode</Label>
          <Switch id="dark-mode" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="compact">Compact View</Label>
          <Switch id="compact" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="animations">Animations</Label>
          <Switch id="animations" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="sounds">Sound Effects</Label>
          <Switch id="sounds" />
        </div>
      </div>
    </div>
  ),
};

// Parlay toggle example
export const ParlayToggle: Story = {
  render: () => (
    <div className="flex items-center justify-between p-4 border rounded-lg w-[300px]">
      <div>
        <Label htmlFor="parlay" className="text-base font-medium">
          Parlay Mode
        </Label>
        <p className="text-sm text-muted-foreground">
          Combine all bets into a single parlay
        </p>
      </div>
      <Switch id="parlay" />
    </div>
  ),
};

// Privacy settings
export const PrivacySettings: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <h4 className="font-medium">Privacy & Data</h4>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="analytics">Analytics</Label>
            <p className="text-xs text-muted-foreground">
              Help improve the app by sharing usage data
            </p>
          </div>
          <Switch id="analytics" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="personalization">Personalization</Label>
            <p className="text-xs text-muted-foreground">
              Get personalized recommendations
            </p>
          </div>
          <Switch id="personalization" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="share-public">Public Profile</Label>
            <p className="text-xs text-muted-foreground">
              Allow others to see your betting stats
            </p>
          </div>
          <Switch id="share-public" />
        </div>
      </div>
    </div>
  ),
};
