import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Button } from './button';

/**
 * Card Component Stories
 * Visual regression tests for card layouts and content
 */
const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
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

// Basic card
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content with some text.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

// Card without footer
export const WithoutFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Simple Card</CardTitle>
        <CardDescription>A card without footer</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card only has header and content sections.</p>
      </CardContent>
    </Card>
  ),
};

// Card grid
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle>Card {i}</CardTitle>
            <CardDescription>Description for card {i}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Content for card {i}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

// Stats card example
export const StatsCard: Story = {
  render: () => (
    <Card className="w-[200px]">
      <CardHeader className="pb-2">
        <CardDescription>Total Bets</CardDescription>
        <CardTitle className="text-3xl">1,234</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          +20.1% from last month
        </p>
      </CardContent>
    </Card>
  ),
};

// Interactive card
export const InteractiveCard: Story = {
  render: () => (
    <Card className="w-[350px] cursor-pointer transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle>Clickable Card</CardTitle>
        <CardDescription>This card has hover effects</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Hover over this card to see the shadow effect.</p>
      </CardContent>
    </Card>
  ),
};
