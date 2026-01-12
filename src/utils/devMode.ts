/**
 * Development Mode Utility
 * 
 * Provides centralized dev mode detection for:
 * - Using local storage as fallback when user is not authenticated
 * - Enabling development-only features
 * 
 * This does NOT inject fake data - it only enables fallback behaviors
 * for unauthenticated users to test the app.
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

// Minimal dev user info for auth context when no real user is logged in
export const DEV_USER = {
  id: 'dev-user-local',
  email: 'local@example.com',
  user_metadata: {
    full_name: 'Local User',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

// Minimal dev profile for auth context
export const DEV_PROFILE = {
  id: 'dev-user-local',
  email: 'local@example.com',
  full_name: 'Local User',
  avatar_url: null,
  subscription_status: 'free',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  preferences: null,
};
