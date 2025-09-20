import { useState, useEffect } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '@/lib/storage';
import { getSettings, saveSettings, updateSetting as updateStorageSetting } from '@/lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await getSettings();
      setSettings(savedSettings);
      
      // Apply theme on load
      applyTheme(savedSettings.theme);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyTheme = (theme: AppSettings['theme']) => {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    try {
      await updateStorageSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // Apply theme immediately if changed
      if (key === 'theme') {
        applyTheme(value as AppSettings['theme']);
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const resetSettings = async () => {
    try {
      await saveSettings(DEFAULT_SETTINGS);
      setSettings(DEFAULT_SETTINGS);
      applyTheme(DEFAULT_SETTINGS.theme);
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  return {
    settings,
    isLoading,
    updateSetting,
    resetSettings,
    refreshSettings: loadSettings
  };
}