import type { Preview } from '@storybook/react';
import '../src/index.css';

/**
 * Storybook Preview Configuration
 * Configures global decorators and parameters for visual testing
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Chromatic-specific parameters
    chromatic: {
      // Viewports for automatic responsive testing
      viewports: [375, 768, 1280],
      // Modes for theme testing
      modes: {
        light: {
          theme: 'light',
        },
        dark: {
          theme: 'dark',
        },
      },
      // Disable animations for stable snapshots
      pauseAnimationAtEnd: true,
      // Wait for fonts to load
      delay: 300,
    },
    // Default background
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
  // Global decorators for theming
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      document.documentElement.classList.toggle('dark', theme === 'dark');
      return Story();
    },
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
