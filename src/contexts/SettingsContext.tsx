
"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export type TimeFormat = '12h' | '24h';
export type HourFormat = 'decimal' | 'hhmm' | 'both';
export type Theme = 'light' | 'dark' | 'system';
export type ProjectSortBy = 'name' | 'createdAt' | 'totalHours';
export type SortDir = 'asc' | 'desc';

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
  projectSortBy: ProjectSortBy;
  setProjectSortBy: (by: ProjectSortBy) => void;
  projectSortDir: SortDir;
  setProjectSortDir: (dir: SortDir) => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [timeFormat, setTimeFormat, isTimeFormatInitialized] = useLocalStorage<TimeFormat>('timeFormat', '12h');
  const [hourFormat, setHourFormat, isHourFormatInitialized] = useLocalStorage<HourFormat>('hourFormat', 'decimal');
  const [confirmDeleteShift, setConfirmDeleteShift, isConfirmDeleteShiftInitialized] = useLocalStorage<boolean>('confirmDeleteShift', true);
  const [theme, setTheme, isThemeInitialized] = useLocalStorage<Theme>('theme', 'light');
  const [projectSortBy, setProjectSortBy, isSortByInit] = useLocalStorage<ProjectSortBy>('projectSortBy', 'name');
  const [projectSortDir, setProjectSortDir, isSortDirInit] = useLocalStorage<SortDir>('projectSortDir', 'asc');
  
  const isInitialized = isTimeFormatInitialized && isHourFormatInitialized && isConfirmDeleteShiftInitialized && isThemeInitialized && isSortByInit && isSortDirInit;

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
    projectSortBy,
    setProjectSortBy,
    projectSortDir,
    setProjectSortDir,
  }), [timeFormat, setTimeFormat, hourFormat, setHourFormat, confirmDeleteShift, setConfirmDeleteShift, isInitialized, theme, setTheme, projectSortBy, setProjectSortBy, projectSortDir, setProjectSortDir]);

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
