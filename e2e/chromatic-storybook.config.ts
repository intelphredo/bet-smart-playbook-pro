/**
 * Chromatic Configuration for Storybook Visual Testing
 * 
 * Chromatic provides:
 * - Visual regression testing for Storybook components
 * - UI Review workflows with team collaboration
 * - Cross-browser testing (Chrome, Firefox, Safari, Edge)
 * - Automatic baseline management
 * - Integration with GitHub/GitLab PR workflows
 * 
 * Setup Instructions:
 * 
 * 1. Install Storybook (if not already):
 *    npx storybook@latest init
 * 
 * 2. Create a Chromatic account at https://www.chromatic.com
 * 
 * 3. Get your project token from Chromatic dashboard
 * 
 * 4. Add CHROMATIC_PROJECT_TOKEN to your environment/CI secrets
 * 
 * 5. Run Chromatic:
 *    npx chromatic --project-token=<your-token>
 * 
 * CI Integration (add to GitHub Actions):
 * 
 * jobs:
 *   chromatic:
 *     runs-on: ubuntu-latest
 *     steps:
 *       - uses: actions/checkout@v4
 *         with:
 *           fetch-depth: 0
 *       - uses: actions/setup-node@v4
 *       - run: npm ci
 *       - run: npx chromatic
 *         env:
 *           CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
 */

export const chromaticConfig = {
  // Project configuration
  projectToken: process.env.CHROMATIC_PROJECT_TOKEN,
  
  // Build configuration
  buildScriptName: 'build-storybook',
  
  // Modes for testing different visual states
  modes: {
    light: {
      theme: 'light',
    },
    dark: {
      theme: 'dark',
    },
  },
  
  // Viewports for responsive testing
  viewports: {
    mobile: {
      width: 375,
      height: 667,
    },
    tablet: {
      width: 768,
      height: 1024,
    },
    desktop: {
      width: 1280,
      height: 800,
    },
  },
  
  // Delay capture to wait for animations
  delay: 500,
  
  // Diff threshold (0-1)
  diffThreshold: 0.063,
  
  // Enable anti-aliasing diffing
  antialias: true,
  
  // Pause animations for stable snapshots
  pauseAnimationAtEnd: true,
};

export default chromaticConfig;
