import type { Meta, StoryObj } from '@storybook/react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

/**
 * Sheet (Drawer) Component Stories
 * Visual regression tests for slide-out panels
 */
const meta: Meta<typeof Sheet> = {
  title: 'UI/Sheet',
  component: Sheet,
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

// Default sheet (right side)
export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>
            This is a description of the sheet content.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p>Sheet body content goes here.</p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

// Left side sheet
export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Left Sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>
            Browse the application menu.
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-2 py-4">
          <Button variant="ghost" className="justify-start">Home</Button>
          <Button variant="ghost" className="justify-start">Predictions</Button>
          <Button variant="ghost" className="justify-start">Bet History</Button>
          <Button variant="ghost" className="justify-start">Analytics</Button>
          <Button variant="ghost" className="justify-start">Settings</Button>
        </nav>
      </SheetContent>
    </Sheet>
  ),
};

// Top sheet
export const TopSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">Open Top Sheet</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            You have 3 unread notifications.
          </SheetDescription>
        </SheetHeader>
        <div className="flex gap-4 py-4">
          <Button variant="outline" size="sm">Mark all as read</Button>
          <Button variant="outline" size="sm">Settings</Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

// Bottom sheet
export const BottomSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Bottom Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Quick Actions</SheetTitle>
          <SheetDescription>
            Select an action to perform.
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-4 gap-4 py-4">
          <Button variant="outline" className="flex-col h-20">
            <span>🎯</span>
            <span className="text-xs">New Bet</span>
          </Button>
          <Button variant="outline" className="flex-col h-20">
            <span>📊</span>
            <span className="text-xs">Stats</span>
          </Button>
          <Button variant="outline" className="flex-col h-20">
            <span>🔔</span>
            <span className="text-xs">Alerts</span>
          </Button>
          <Button variant="outline" className="flex-col h-20">
            <span>⚙️</span>
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

// Sheet with form
export const WithForm: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Edit Settings</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Settings</SheetTitle>
          <SheetDescription>
            Make changes to your settings here.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" defaultValue="John Doe" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" defaultValue="john@example.com" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bankroll" className="text-right">
              Bankroll
            </Label>
            <Input id="bankroll" type="number" defaultValue="1000" className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button type="submit">Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

// Bet slip sheet
export const BetSlipSheet: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="relative">
          Bet Slip
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs flex items-center justify-center">
            3
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your Bet Slip</SheetTitle>
          <SheetDescription>
            3 selections added
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 py-4">
          {[
            { team: 'Lakers', type: 'Moneyline', odds: '-150' },
            { team: 'Celtics', type: 'Spread -3.5', odds: '-110' },
            { team: 'Warriors vs Suns', type: 'Over 220.5', odds: '-105' },
          ].map((bet, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex justify-between">
                <span className="font-medium">{bet.team}</span>
                <span className="text-primary">{bet.odds}</span>
              </div>
              <span className="text-sm text-muted-foreground">{bet.type}</span>
              <div className="mt-2">
                <Input type="number" placeholder="Stake" className="h-8" />
              </div>
            </div>
          ))}
        </div>
        <SheetFooter className="flex-col gap-2">
          <div className="flex justify-between w-full text-sm">
            <span>Total Stake:</span>
            <span className="font-medium">$0.00</span>
          </div>
          <div className="flex justify-between w-full text-sm">
            <span>Potential Payout:</span>
            <span className="font-medium text-green-600">$0.00</span>
          </div>
          <Button className="w-full">Place Bets</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

// Open state for Chromatic
export const OpenState: Story = {
  render: () => (
    <Sheet defaultOpen>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Static Open Sheet</SheetTitle>
          <SheetDescription>
            This sheet is open by default for visual testing.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p>This captures the open state for visual regression tests.</p>
        </div>
      </SheetContent>
    </Sheet>
  ),
};
