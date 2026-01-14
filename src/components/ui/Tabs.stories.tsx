import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

/**
 * Tabs Component Stories
 * Visual regression tests for tabs navigation
 */
const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    chromatic: {
      viewports: [375, 768, 1280],
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

// Default tabs
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p className="text-sm text-muted-foreground">Content for Tab 1</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p className="text-sm text-muted-foreground">Content for Tab 2</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p className="text-sm text-muted-foreground">Content for Tab 3</p>
      </TabsContent>
    </Tabs>
  ),
};

// Account settings example
export const AccountSettings: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@johndoe" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

// Betting tabs example
export const BettingTabs: Story = {
  render: () => (
    <Tabs defaultValue="pending" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="won">Won</TabsTrigger>
        <TabsTrigger value="lost">Lost</TabsTrigger>
        <TabsTrigger value="all">All Bets</TabsTrigger>
      </TabsList>
      <TabsContent value="pending" className="mt-4">
        <div className="rounded-lg border p-4">
          <p className="font-medium">5 Pending Bets</p>
          <p className="text-sm text-muted-foreground">Total stake: $250</p>
        </div>
      </TabsContent>
      <TabsContent value="won" className="mt-4">
        <div className="rounded-lg border p-4 border-green-500/20 bg-green-500/5">
          <p className="font-medium text-green-600">12 Winning Bets</p>
          <p className="text-sm text-muted-foreground">Total profit: +$1,250</p>
        </div>
      </TabsContent>
      <TabsContent value="lost" className="mt-4">
        <div className="rounded-lg border p-4 border-red-500/20 bg-red-500/5">
          <p className="font-medium text-red-600">8 Lost Bets</p>
          <p className="text-sm text-muted-foreground">Total loss: -$400</p>
        </div>
      </TabsContent>
      <TabsContent value="all" className="mt-4">
        <div className="rounded-lg border p-4">
          <p className="font-medium">25 Total Bets</p>
          <p className="text-sm text-muted-foreground">Net profit: +$850</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

// With disabled tab
export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="active" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="archived">Archived</TabsTrigger>
        <TabsTrigger value="premium" disabled>
          Premium
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <p className="text-sm text-muted-foreground p-4">Active content</p>
      </TabsContent>
      <TabsContent value="archived">
        <p className="text-sm text-muted-foreground p-4">Archived content</p>
      </TabsContent>
    </Tabs>
  ),
};

// Full width tabs
export const FullWidth: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-[600px]">
      <TabsList className="w-full">
        <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
        <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
        <TabsTrigger value="reports" className="flex-1">Reports</TabsTrigger>
        <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Overview dashboard content</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};
