
"use client";

import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Project, Shift, ActiveShift, Period } from '@/lib/types';
import { format, differenceInSeconds, parseISO } from 'date-fns';

interface AppDataContextProps {
  projects: Project[];
  shifts: Shift[];
  periods: Period[];
  activeShifts: ActiveShift[];
  setProjectShowPastPeriods: (projectId: string, show: boolean) => void;
  addProject: (name: string) => void;
  updateProject: (updatedProject: Project) => void;
  deleteProject: (projectId: string) => void;
  archiveProject: (projectId: string) => void;
  unarchiveProject: (projectId: string) => void;
  consolidateCurrentPeriod: (projectId: string, periodName?: string) => void;
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
  updateActiveShiftStart: (activeShiftId: string, newStartISO: string) => void;
}

const AppDataContext = createContext<AppDataContextProps | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects, isProjectsInitialized] = useLocalStorage<Project[]>('projects', []);
  const [shifts, setShifts, isShiftsInitialized] = useLocalStorage<Shift[]>('shifts', []);
  const [activeShifts, setActiveShifts, isActiveShiftsInitialized] = useLocalStorage<ActiveShift[]>('activeShifts', []);
  const [periods, setPeriods, isPeriodsInitialized] = useLocalStorage<Period[]>('periods', []);

  const isInitialized = isProjectsInitialized && isShiftsInitialized && isActiveShiftsInitialized && isPeriodsInitialized;

  // Backfill createdAt for legacy projects
  useEffect(() => {
    if (!isProjectsInitialized) return;
  const needsBackfill = projects.some(p => !('createdAt' in p) || !p.createdAt || !('archived' in p) || !('showPastPeriods' in p));
    if (needsBackfill) {
      const now = new Date().toISOString();
      setProjects(prev => prev.map(p => ({
        ...p,
        createdAt: p.createdAt ?? now,
    archived: p.archived ?? false,
    showPastPeriods: p.showPastPeriods ?? true,
      })));
    }
  }, [isProjectsInitialized, projects, setProjects]);

  // Migration: fix blank or duplicate shift IDs (caused by earlier edit bug)
  useEffect(() => {
    if (!isShiftsInitialized) return;
    setShifts(prev => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;
      const seen = new Set<string>();
      let mutated = false;
      const repaired = prev.map(s => {
        let id = s.id;
        if (!id || id.trim() === '' || seen.has(id)) {
          id = crypto.randomUUID();
          mutated = true;
        }
        seen.add(id);
        return id === s.id ? s : { ...s, id };
      });
      return mutated ? repaired : prev;
    });
  }, [isShiftsInitialized, setShifts]);

  // Guard: continuously ensure no duplicate/blank shift IDs remain (covers legacy state loaded *after* initial effect)
  useEffect(() => {
    if (!isShiftsInitialized) return;
    const ids = new Set<string>();
    let needsRepair = false;
    for (const s of shifts) {
      if (!s.id || s.id.trim() === '' || ids.has(s.id)) {
        needsRepair = true;
        break;
      }
      ids.add(s.id);
    }
    if (needsRepair) {
      setShifts(prev => {
        const seen = new Set<string>();
        return prev.map(s => {
          let id = s.id;
          if (!id || id.trim() === '' || seen.has(id)) {
            id = crypto.randomUUID();
          }
          seen.add(id);
          return id === s.id ? s : { ...s, id };
        });
      });
    }
  }, [shifts, isShiftsInitialized, setShifts]);

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
  const updateActiveShiftStart = (activeShiftId: string, newStartISO: string) => {
    // Basic guard: new start must be before now
    if (new Date(newStartISO) >= new Date()) return;
    setActiveShifts(prev => prev.map(s => s.id === activeShiftId ? { ...s, startTime: newStartISO } : s));
  };
      
  return {
  projects,
    shifts,
  periods,
    activeShifts,
    setProjectShowPastPeriods: (projectId: string, show: boolean) => {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, showPastPeriods: show } : p))
    },
    addProject: (name: string) => {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name,
  createdAt: new Date().toISOString(),
    archived: false,
    showPastPeriods: true,
      };
      setProjects(prev => [...prev, newProject]);
    },
    updateProject: (updatedProject: Project) => {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    },
  archiveProject: (projectId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, archived: true } : p));
  },
  unarchiveProject: (projectId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, archived: false } : p));
  },
    deleteProject: (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setShifts(prev => prev.filter(s => s.projectId !== projectId));
        setActiveShifts(prev => prev.filter(s => s.projectId !== projectId));
        setPeriods(prev => prev.filter(per => per.projectId !== projectId));
    },
    consolidateCurrentPeriod: (projectId: string, periodName?: string) => {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const name = periodName?.trim() || `Period ${new Date().toLocaleDateString()}`;
      const newPeriod: Period = { id, projectId, name, createdAt: now };
      setPeriods(prev => [...prev, newPeriod]);
      // Assign all current active-period shifts (those without periodId) to this new period
      setShifts(prev => prev.map(s => s.projectId === projectId && !s.periodId ? { ...s, periodId: id } : s));
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
        .filter(s => s.projectId === projectId && !s.periodId)
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
  updateActiveShiftStart,
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
