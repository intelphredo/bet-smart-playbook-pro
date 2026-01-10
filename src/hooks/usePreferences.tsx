import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserPreferences, DEFAULT_PREFERENCES } from '@/types/preferences';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';
import { isDevMode } from '@/utils/devMode';

const LOCAL_STORAGE_KEY = 'dev_mode_preferences';

interface PreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreference: <K extends keyof UserPreferences>(
    category: K,
    key: keyof UserPreferences[K],
    value: UserPreferences[K][keyof UserPreferences[K]]
  ) => Promise<void>;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  isFavoriteLeague: (league: string) => boolean;
  isFavoriteTeam: (team: string) => boolean;
  toggleFavoriteLeague: (league: string) => Promise<void>;
  toggleFavoriteTeam: (team: string) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const devMode = isDevMode();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch preferences from database or localStorage
  const fetchPreferences = useCallback(async () => {
    // In dev mode, use localStorage
    if (devMode) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
        } catch {
          setPreferences(DEFAULT_PREFERENCES);
        }
      }
      setIsLoading(false);
      return;
    }

    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_preferences', { user_id_param: user.id });

      if (error) throw error;

      if (data && typeof data === 'object') {
        const parsedData = data as Record<string, unknown>;
        setPreferences({ 
          ...DEFAULT_PREFERENCES, 
          ...(parsedData as unknown as Partial<UserPreferences>)
        });
      }
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, devMode]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Update a single preference
  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    category: K,
    key: keyof UserPreferences[K],
    value: UserPreferences[K][keyof UserPreferences[K]]
  ) => {
    const newPrefs = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: value,
      },
    };

    // Optimistic update
    setPreferences(newPrefs);

    // In dev mode, save to localStorage
    if (devMode) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPrefs));
      return;
    }

    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to save preferences.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: JSON.parse(JSON.stringify(newPrefs)) as Json })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating preference:', error);
      // Revert on error
      setPreferences(preferences);
      toast({
        title: 'Error saving preference',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [user, preferences, toast, devMode]);

  // Update multiple preferences at once
  const updatePreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    const mergedPrefs = {
      ...preferences,
      ...newPrefs,
    };

    setPreferences(mergedPrefs);

    // In dev mode, save to localStorage
    if (devMode) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedPrefs));
      toast({
        title: 'Preferences saved (Dev Mode)',
        description: 'Saved to localStorage.',
      });
      return;
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: JSON.parse(JSON.stringify(mergedPrefs)) as Json })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Preferences saved',
        description: 'Your preferences have been updated.',
      });
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      setPreferences(preferences);
      toast({
        title: 'Error saving preferences',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [user, preferences, toast, devMode]);

  // Reset to defaults
  const resetPreferences = useCallback(async () => {
    // In dev mode, reset localStorage
    if (devMode) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setPreferences(DEFAULT_PREFERENCES);
      toast({
        title: 'Preferences reset (Dev Mode)',
        description: 'Reset to defaults.',
      });
      return;
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: JSON.parse(JSON.stringify(DEFAULT_PREFERENCES)) as Json })
        .eq('id', user.id);

      if (error) throw error;

      setPreferences(DEFAULT_PREFERENCES);
      toast({
        title: 'Preferences reset',
        description: 'Your preferences have been reset to defaults.',
      });
    } catch (error: any) {
      console.error('Error resetting preferences:', error);
      toast({
        title: 'Error resetting preferences',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [user, toast, devMode]);

  // Helper functions for favorites
  const isFavoriteLeague = useCallback((league: string) => {
    return preferences.favorites.leagues.includes(league);
  }, [preferences.favorites.leagues]);

  const isFavoriteTeam = useCallback((team: string) => {
    return preferences.favorites.teams.includes(team);
  }, [preferences.favorites.teams]);

  const toggleFavoriteLeague = useCallback(async (league: string) => {
    const leagues = preferences.favorites.leagues.includes(league)
      ? preferences.favorites.leagues.filter(l => l !== league)
      : [...preferences.favorites.leagues, league];

    await updatePreference('favorites', 'leagues', leagues);
  }, [preferences.favorites.leagues, updatePreference]);

  const toggleFavoriteTeam = useCallback(async (team: string) => {
    const teams = preferences.favorites.teams.includes(team)
      ? preferences.favorites.teams.filter(t => t !== team)
      : [...preferences.favorites.teams, team];

    await updatePreference('favorites', 'teams', teams);
  }, [preferences.favorites.teams, updatePreference]);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        updatePreference,
        updatePreferences,
        resetPreferences,
        isFavoriteLeague,
        isFavoriteTeam,
        toggleFavoriteLeague,
        toggleFavoriteTeam,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
