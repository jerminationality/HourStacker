
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Project, Shift, ActiveShift } from '@/lib/types';
import { format, differenceInSeconds, parseISO } from 'date-fns';

interface AppDataContextProps {
  projects: Project[];
  shifts: Shift[];
  activeShifts: ActiveShift[];
  addProject: (name: string) => void;
  updateProject: (updatedProject: Project) => void;
  deleteProject: (projectId: string) => void;
  addShift: (shiftData: Omit<Shift, 'id'>) => void;
  updateShift: (updatedShift: Shift) => void;
  deleteShift: (shiftId: string) => void;
  deleteShiftsByDate: (projectId: string, date: string) => void;
  getProjectById: (id: string) => Project | undefined;
  getShiftsByProjectId: (projectId: string) => Shift[];
  isInitialized: boolean;
  startShift: (projectId: string) => void;
  endShift: (activeShiftId: string) => void;
  getActiveShift: (projectId: string) => ActiveShift | undefined;
}

const AppDataContext = createContext<AppDataContextProps | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects, isProjectsInitialized] = useLocalStorage<Project[]>('projects', []);
  const [shifts, setShifts, isShiftsInitialized] = useLocalStorage<Shift[]>('shifts', []);
  const [activeShifts, setActiveShifts, isActiveShiftsInitialized] = useLocalStorage<ActiveShift[]>('activeShifts', []);

  const isInitialized = isProjectsInitialized && isShiftsInitialized && isActiveShiftsInitialized;

  // Backfill createdAt for legacy projects
  useEffect(() => {
    if (!isProjectsInitialized) return;
    const needsBackfill = projects.some(p => !('createdAt' in p) || !p.createdAt);
    if (needsBackfill) {
      const now = new Date().toISOString();
      setProjects(prev => prev.map(p => ({
        ...p,
        createdAt: p.createdAt ?? now,
      })));
    }
  }, [isProjectsInitialized, projects, setProjects]);

  const contextValue = useMemo(() => {
    const startShift = (projectId: string) => {
        const newActiveShift: ActiveShift = {
          id: crypto.randomUUID(),
          projectId,
          startTime: new Date().toISOString(),
        };
        setActiveShifts(prev => [...prev, newActiveShift]);
    };

    const endShift = (activeShiftId: string) => {
        const shiftToEnd = activeShifts.find(s => s.id === activeShiftId);
        if (!shiftToEnd) return;

        const endTime = new Date();
        const startTime = new Date(shiftToEnd.startTime);
        const totalSeconds = differenceInSeconds(endTime, startTime);
        const totalHours = totalSeconds / 3600;

        const newShift: Omit<Shift, 'id'> = {
            projectId: shiftToEnd.projectId,
            hours: totalHours,
            date: format(startTime, 'yyyy-MM-dd'),
            startTime: format(startTime, 'HH:mm'),
            endTime: format(endTime, 'HH:mm'),
            description: null,
        };

        const newStoredShift: Shift = {
            id: crypto.randomUUID(),
            ...newShift,
        };
        setShifts(prev => [newStoredShift, ...prev]);
        setActiveShifts(prev => prev.filter(s => s.id !== activeShiftId));
    };

    const getActiveShift = (projectId: string) => {
        return activeShifts.find(s => s.projectId === projectId);
    };
      
    return {
    projects,
    shifts,
    activeShifts,
    addProject: (name: string) => {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name,
  createdAt: new Date().toISOString(),
      };
      setProjects(prev => [...prev, newProject]);
    },
    updateProject: (updatedProject: Project) => {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    },
    deleteProject: (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setShifts(prev => prev.filter(s => s.projectId !== projectId));
        setActiveShifts(prev => prev.filter(s => s.projectId !== projectId));
    },
    addShift: (shiftData: Omit<Shift, 'id'>) => {
      const newShift: Shift = {
        id: crypto.randomUUID(),
        ...shiftData,
      };
      setShifts(prev => [newShift, ...prev]);
    },
    updateShift: (updatedShift: Shift) => {
        setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
    },
    deleteShift: (shiftId: string) => {
        setShifts(prev => prev.filter(s => s.id !== shiftId));
    },
    deleteShiftsByDate: (projectId: string, date: string) => {
        setShifts(prev => prev.filter(s => !(s.projectId === projectId && s.date === date)));
    },
    getProjectById: (id: string) => {
      return projects.find(p => p.id === id);
    },
    getShiftsByProjectId: (projectId: string) => {
      return shifts
        .filter(s => s.projectId === projectId)
        .sort((a, b) => {
            const dateA = parseISO(`${a.date}T${a.startTime}`);
            const dateB = parseISO(`${b.date}T${b.startTime}`);
            return dateB.getTime() - dateA.getTime();
        });
    },
    isInitialized,
    startShift,
    endShift,
    getActiveShift,
  }}, [projects, setProjects, shifts, setShifts, activeShifts, setActiveShifts, isInitialized]);

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
