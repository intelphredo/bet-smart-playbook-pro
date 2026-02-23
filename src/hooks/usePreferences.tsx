import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserPreferences, DEFAULT_PREFERENCES } from '@/types/preferences';
import { toast } from 'sonner';
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
  const devMode = isDevMode();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch preferences from database or localStorage
  const fetchPreferences = useCallback(async () => {
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
        const merged = { 
          ...DEFAULT_PREFERENCES,
          ...(parsedData as unknown as Partial<UserPreferences>),
          favorites: {
            ...DEFAULT_PREFERENCES.favorites,
            ...((parsedData as any)?.favorites ?? {}),
            leagues: Array.isArray((parsedData as any)?.favorites?.leagues) 
              ? (parsedData as any).favorites.leagues 
              : DEFAULT_PREFERENCES.favorites.leagues,
            teams: Array.isArray((parsedData as any)?.favorites?.teams) 
              ? (parsedData as any).favorites.teams 
              : DEFAULT_PREFERENCES.favorites.teams,
            sportsbooks: Array.isArray((parsedData as any)?.favorites?.sportsbooks) 
              ? (parsedData as any).favorites.sportsbooks 
              : DEFAULT_PREFERENCES.favorites.sportsbooks,
            matches: Array.isArray((parsedData as any)?.favorites?.matches) 
              ? (parsedData as any).favorites.matches 
              : DEFAULT_PREFERENCES.favorites.matches,
          },
        };
        setPreferences(merged);
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

    setPreferences(newPrefs);

    if (devMode) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPrefs));
      return;
    }

    if (!user) {
      toast.error('Login required', { description: 'Please login to save preferences.' });
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
      setPreferences(preferences);
      toast.error('Error saving preference', { description: error.message });
    }
  }, [user, preferences, devMode]);

  const updatePreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    const mergedPrefs = {
      ...preferences,
      ...newPrefs,
    };

    setPreferences(mergedPrefs);

    if (devMode) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedPrefs));
      toast.success('Preferences saved (Dev Mode)', { description: 'Saved to localStorage.' });
      return;
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: JSON.parse(JSON.stringify(mergedPrefs)) as Json })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Preferences saved', { description: 'Your preferences have been updated.' });
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      setPreferences(preferences);
      toast.error('Error saving preferences', { description: error.message });
    }
  }, [user, preferences, devMode]);

  const resetPreferences = useCallback(async () => {
    if (devMode) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setPreferences(DEFAULT_PREFERENCES);
      toast.success('Preferences reset (Dev Mode)', { description: 'Reset to defaults.' });
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
      toast.success('Preferences reset', { description: 'Your preferences have been reset to defaults.' });
    } catch (error: any) {
      console.error('Error resetting preferences:', error);
      toast.error('Error resetting preferences', { description: error.message });
    }
  }, [user, devMode]);

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
