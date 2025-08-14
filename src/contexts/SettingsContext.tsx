
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export type TimeFormat = '12h' | '24h';
export type HourFormat = 'decimal' | 'hhmm' | 'both';
export type Theme = 'light' | 'dark' | 'system';

interface SettingsContextProps {
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  hourFormat: HourFormat;
  setHourFormat: (format: HourFormat) => void;
  confirmDeleteShift: boolean;
  setConfirmDeleteShift: (confirm: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isInitialized: boolean;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [timeFormat, setTimeFormat, isTimeFormatInitialized] = useLocalStorage<TimeFormat>('timeFormat', '12h');
  const [hourFormat, setHourFormat, isHourFormatInitialized] = useLocalStorage<HourFormat>('hourFormat', 'decimal');
  const [confirmDeleteShift, setConfirmDeleteShift, isConfirmDeleteShiftInitialized] = useLocalStorage<boolean>('confirmDeleteShift', true);
  const [theme, setTheme, isThemeInitialized] = useLocalStorage<Theme>('theme', 'light');
  
  const isInitialized = isTimeFormatInitialized && isHourFormatInitialized && isConfirmDeleteShiftInitialized && isThemeInitialized;

  const contextValue = useMemo(() => ({ // Add theme to the dependency array
    timeFormat,
    setTimeFormat,
    hourFormat,
    setHourFormat,
    confirmDeleteShift,
    setConfirmDeleteShift,
    isInitialized,
    theme,
    setTheme,
  }), [timeFormat, setTimeFormat, hourFormat, setHourFormat, confirmDeleteShift, setConfirmDeleteShift, isInitialized, theme, setTheme]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
