/**
 * Development Mode Utility
 * 
 * Provides centralized dev mode detection for bypassing authentication
 * during development and testing.
 */

export const isDevMode = (): boolean => {
  // Check Vite development mode
  if (import.meta.env.DEV) {
    return true;
  }
  
  // Check for explicit creator mode flag (for production testing)
  if (import.meta.env.VITE_CREATOR_MODE === 'true') {
    return true;
  }
  
  return false;
};

// Mock user for dev mode
export const DEV_USER = {
  id: 'dev-user-00000000-0000-0000-0000-000000000000',
  email: 'developer@example.com',
  user_metadata: {
    full_name: 'Developer Mode',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

// Mock profile for dev mode
export const DEV_PROFILE = {
  id: 'dev-user-00000000-0000-0000-0000-000000000000',
  email: 'developer@example.com',
  full_name: 'Developer Mode',
  avatar_url: null,
  subscription_status: 'premium',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  preferences: null,
};
