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
  // Only enable dev mode when explicitly requested.
  // (Preview builds run in dev-like environments; we don't want mock auth enabled by default.)

  // Explicit creator mode flag (for production testing)
  if (import.meta.env.VITE_CREATOR_MODE === "true") {
    return true;
  }

  // Optional explicit runtime toggle
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const paramEnabled = params.get("dev") === "1" || params.get("devMode") === "true";
      const storageEnabled = window.localStorage.getItem("EDGEIQ_DEV_MODE") === "true";
      return paramEnabled || storageEnabled;
    } catch {
      // ignore
    }
  }

  return false;
};

// Use a valid UUID format for dev user to avoid database errors
export const DEV_USER = {
  id: '00000000-0000-0000-0000-000000000000', // Valid UUID for dev mode
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
  id: '00000000-0000-0000-0000-000000000000', // Valid UUID for dev mode
  email: 'local@example.com',
  full_name: 'Local User',
  avatar_url: null,
  subscription_status: 'free',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  preferences: null,
};
