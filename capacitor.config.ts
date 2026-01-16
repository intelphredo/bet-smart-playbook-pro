import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3426c413d03f43a0bdab3b303a71532e',
  appName: 'EdgeIQ',
  webDir: 'dist',
  server: {
    url: 'https://3426c413-d03f-43a0-bdab-3b303a71532e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0a0f1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0a0f1a'
  },
  android: {
    backgroundColor: '#0a0f1a'
  }
};

export default config;
