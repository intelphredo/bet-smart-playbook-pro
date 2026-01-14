import { useState, useEffect, useCallback } from "react";
import { BankrollSettings, DEFAULT_BANKROLL_SETTINGS } from "@/types/bankroll";

const STORAGE_KEY = "bankroll_settings";

interface UseBankrollSettingsReturn {
  settings: BankrollSettings;
  setSettings: (settings: BankrollSettings | ((prev: BankrollSettings) => BankrollSettings)) => void;
  resetSettings: () => void;
  isLoaded: boolean;
}

export function useBankrollSettings(): UseBankrollSettingsReturn {
  const [settings, setSettingsState] = useState<BankrollSettings>(DEFAULT_BANKROLL_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle any new fields
        setSettingsState({
          ...DEFAULT_BANKROLL_SETTINGS,
          ...parsed,
        });
      }
    } catch (error) {
      console.error("Failed to load bankroll settings:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to save bankroll settings:", error);
      }
    }
  }, [settings, isLoaded]);

  const setSettings = useCallback((
    newSettings: BankrollSettings | ((prev: BankrollSettings) => BankrollSettings)
  ) => {
    setSettingsState(newSettings);
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_BANKROLL_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to reset bankroll settings:", error);
    }
  }, []);

  return {
    settings,
    setSettings,
    resetSettings,
    isLoaded,
  };
}
