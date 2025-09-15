
"use client";

import { useState, useMemo, useEffect, useContext, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Link is already imported earlier in this file
import { useAppData } from '@/contexts/AppDataContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewShiftDialog } from '@/components/NewShiftDialog';
import { ArrowLeft, Plus, Calendar, Edit, Trash2, MoreVertical, Clock, ClipboardCopy, ArchiveRestore, Archive, Layers, ChevronDown } from 'lucide-react';
import Link from 'next/link';
// Removed tooltip for periods icon as periods are inline again
import { format, parseISO } from 'date-fns';
import type { Shift, Project, ActiveShift, Period } from '@/lib/types';
import { formatHours, formatTime, HeaderContext, formatHoursForExport, formatShiftRange, isOvernight, minutesFromTime } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { NewProjectDialog } from '@/components/NewProjectDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ActiveShiftCard } from '@/components/ActiveShiftCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as AccordionPrimitive from '@radix-ui/react-accordion';

export default function ProjectPage() {
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<Shift | null>(null);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [periodToDelete, setPeriodToDelete] = useState<Period | null>(null);
  const [isProjectDeleteAlertOpen, setIsProjectDeleteAlertOpen] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [defaultAccordionValue, setDefaultAccordionValue] = useState<string[]>([]);
  // No one-time tooltip needed when periods render inline

  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { timeFormat, hourFormat, confirmDeleteShift, setConfirmDeleteShift: setConfirmDelete, showTotalProjectHoursOnCards } = useSettings();
  const { 
  getProjectById, 
    getShiftsByProjectId, 
    isInitialized, 
    deleteShift, 
    deleteShiftsByDate,
    deleteProject,
    archiveProject,
    unarchiveProject,
    startShift,
    endShift,
    getActiveShift,
  updateActiveShiftStart,
    shifts: allShifts,
    periods,
    consolidateCurrentPeriod,
    revertPeriod,
    deletePeriod,
  setProjectShowPastPeriods,
  } = useAppData();
  
  const projectIdRaw = (params as Record<string, string | string[]>)["id"];
  const projectId = typeof projectIdRaw === 'string' ? projectIdRaw : '';
  const project = getProjectById(projectId);
  const shifts = getShiftsByProjectId(projectId);
  const projectPeriods: Period[] = useMemo(() => {
    const filtered = periods.filter(p => p.projectId === projectId);
    return filtered.sort((a, b) => {
      const aDates = allShifts.filter(s => s.projectId === projectId && s.periodId === a.id).map(s => s.date).filter(Boolean).sort();
      const bDates = allShifts.filter(s => s.projectId === projectId && s.periodId === b.id).map(s => s.date).filter(Boolean).sort();
      const aKey = aDates[0] || a.createdAt;
      const bKey = bDates[0] || b.createdAt;
      // chronological ascending (oldest first)
      return new Date(aKey).getTime() - new Date(bKey).getTime();
    });
  }, [periods, projectId, allShifts]);
  // Always view current (unconsolidated) shifts on the project page; consolidated periods render separately above.
  const viewedShifts = shifts;
  const activeShift = getActiveShift(projectId);
  const isHeader = useContext(HeaderContext);

  // Listen for active shift start edit events dispatched by ActiveShiftCard
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string; iso: string } | undefined;
      if (!detail) return;
      if (activeShift && activeShift.id === detail.id) {
        updateActiveShiftStart(detail.id, detail.iso);
      }
    };
    window.addEventListener('update-active-shift-start', handler as EventListener);
    return () => window.removeEventListener('update-active-shift-start', handler as EventListener);
  }, [activeShift, updateActiveShiftStart]);

  const handleStartShift = () => {
    if (!activeShift) startShift(projectId);
  };

  const handleEditShiftClick = (shift: Shift) => {
    setShiftToEdit(shift);
    setIsShiftDialogOpen(true);
  };

  const handleDeleteShiftClick = (shift: Shift) => {
    setShiftToDelete(shift);
    if (confirmDeleteShift) {
      setIsAlertOpen(true);
    } else {
      deleteShift(shift.id);
      setShiftToDelete(null);
    }
  };
  
  const handleConfirmDeleteShift = () => {
      if (shiftToDelete) {
          deleteShift(shiftToDelete.id);
          setIsAlertOpen(false);
          setShiftToDelete(null);
          if (dontAskAgain) {
            setConfirmDelete(false);
          }
      }
  };
  
  const handleDeleteGroupClick = (groupName: string) => {
    setGroupToDelete(groupName);
  }

  const handleArchiveToggle = () => {
    if (!project) return;
    if (project.archived) {
      unarchiveProject(project.id);
    } else {
      archiveProject(project.id);
    }
  }

  const confirmDeleteGroup = () => {
    if (groupToDelete && projectId) {
      deleteShiftsByDate(projectId, groupToDelete);
      setGroupToDelete(null);
    }
  }

  const confirmDeleteProject = () => {
      if (project) {
          deleteProject(project.id);
          setIsProjectDeleteAlertOpen(false);
          router.push('/');
      }
  }

  const handleShiftDialogStateChange = (open: boolean) => {
    setIsShiftDialogOpen(open);
    if (!open) {
      setShiftToEdit(null);
    }
  };
  
  const handleProjectDialogStateChange = (open: boolean) => {
      setIsProjectDialogOpen(open);
  }

  const shiftsGroupedByMonth = useMemo(() => {
    const monthGroups = viewedShifts
      .filter((shift) => !!shift.date)
      .reduce((acc, shift) => {
        // Build stable ISO-like keys using the raw date to avoid locale issues with legacy data
        const iso = parseISO(shift.date);
        const monthKey = format(iso, 'yyyy-MM');
        const dayKey = format(iso, 'yyyy-MM-dd');
        acc[monthKey] ||= {} as Record<string, Shift[]>;
        acc[monthKey][dayKey] ||= [] as Shift[];
        acc[monthKey][dayKey].push(shift);
        return acc;
      }, {} as Record<string, Record<string, Shift[]>>);

    const sortedMonths = Object.entries(monthGroups)
      // Lexicographic sort works for yyyy-MM keys (ascending)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([month, dayGroups]) => {
        const sortedDays = Object.entries(dayGroups)
          // yyyy-MM-dd lexicographic sort (ascending)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([day, shiftsInDay]) => {
            const sortedShifts = [...shiftsInDay].sort((s1, s2) => {
              const m1 = minutesFromTime(s1.startTime);
              const m2 = minutesFromTime(s2.startTime);
              return m1 - m2; // ascending within the day
            });
            return [day, sortedShifts] as const;
          });
        return [month, sortedDays] as const;
      });

    return sortedMonths;
  }, [viewedShifts]);

  const monthCount = shiftsGroupedByMonth.length;
  useEffect(() => {
    const last = shiftsGroupedByMonth[shiftsGroupedByMonth.length - 1];
    if (last) {
      setDefaultAccordionValue([last[0]]);
    }
  }, [monthCount]);
  
  const totalHours = useMemo(() => {
    return viewedShifts.reduce((acc, shift) => acc + shift.hours, 0);
  }, [viewedShifts]);
  // Total across all periods + unconsolidated shifts for this project
  const allProjectHours = useMemo(() => {
    return allShifts.filter(s => s.projectId === projectId).reduce((acc, s) => acc + s.hours, 0);
  }, [allShifts, projectId]);

  // Auto-scroll to bottom when there is an active shift (on open or when starting)
  useEffect(() => {
    if (activeShift) {
      const id = window.setTimeout(() => {
        // Jump instantly to bottom without animation
        window.scrollTo(0, document.documentElement.scrollHeight);
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [activeShift]);

  const handleExportToText = () => {
    if (!project) return;

    let exportText = `${project.name}\n`;
    if (hourFormat === 'decimal') {
        exportText += `${totalHours.toFixed(2)} Total Hours\n`;
    } else {
        exportText += `${formatHoursForExport(totalHours, 0)}\n`;
    }
    exportText += "--------------------\n\n";

    shiftsGroupedByMonth.forEach(([month, dayGroups]) => {
        dayGroups.forEach(([date, shiftsInGroup]) => {
            exportText += `${format(parseISO(date), "MMMM do, yyyy")}\n`;
            shiftsInGroup.forEach(shift => {
                exportText += `  ${formatShiftRange(shift.startTime, shift.endTime, timeFormat)}\n`;
                if (hourFormat === 'decimal') {
                    exportText += `  ${shift.hours.toFixed(2)} hours\n`;
                } else {
                    exportText += `  ${formatHoursForExport(shift.hours, 2, true)}\n`;
                }
                if (shift.description) {
                exportText += `  Description: ${shift.description}\n`;
                }
                exportText += `\n`;
            });
        });
    });

    navigator.clipboard.writeText(exportText.trim())
      .then(() => {
        toast({ title: "Copied to clipboard!" });
      })
      .catch(err => {
        toast({ title: "Failed to copy text", description: "Could not copy text to clipboard.", variant: "destructive" });
        console.error('Failed to copy text: ', err);
      });
  };

  if (!isInitialized) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center flex-col text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
        <p className="text-muted-foreground mb-6">The project you are looking for does not exist.</p>
        <Button onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Projects
        </Button>
      </div>
    );
  }

  const renderShiftGroups = (
    dayGroups: readonly (readonly [string, Shift[]])[],
    opts?: { compact?: boolean }
  ) => (
    dayGroups.map(([groupName, groupShifts], idx) => {
      const compact = !!opts?.compact;
      if (compact) {
        return (
          <Card
            key={groupName}
            className="shadow-none border-y border-border rounded-none odd:bg-muted/40 even:bg-background"
          >
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-[13px] font-medium flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {format(parseISO(groupName), "dd/MM/yyyy")}
                </span>
                {groupShifts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive/70 hover:text-destructive"
                    onClick={() => handleDeleteGroupClick(groupName)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-2 px-4">
              <ul className="space-y-2">
                {groupShifts.map((shift, index) => (
                  <li key={shift.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatHours(shift.hours, hourFormat, false)}</p>
                        {shift.startTime && shift.endTime && (
                          <p className="text-[12px] text-muted-foreground flex items-center flex-wrap gap-2">
                            <span>{formatShiftRange(shift.startTime, shift.endTime, timeFormat)}</span>
                            {isOvernight(shift.startTime, shift.endTime) && (
                              <span className="inline-flex items-center rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-medium tracking-wide">
                                Overnight
                              </span>
                            )}
                          </p>
                        )}
                        {shift.description && (
                          <p className="text-[12px] text-muted-foreground pt-0.5 whitespace-pre-wrap">{shift.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditShiftClick(shift)}>
                          <Edit className="h-3 w-3 icon-lg" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteShiftClick(shift)}>
                          <Trash2 className="h-3 w-3 icon-lg" />
                        </Button>
                      </div>
                    </div>
                    {index < groupShifts.length - 1 && <Separator className="mt-2" />}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      }
      // Default (non-compact): card presentation
      return (
        <Card key={groupName}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" /> {format(parseISO(groupName), "PPP")}
              </div>
              {groupShifts.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteGroupClick(groupName)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {groupShifts.map((shift, index) => (
                <li key={shift.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-foreground">{formatHours(shift.hours, hourFormat, false)}</p>
                      {shift.startTime && shift.endTime && (
                        <p className="text-sm text-muted-foreground flex items-center flex-wrap gap-2">
                          <span>{formatShiftRange(shift.startTime, shift.endTime, timeFormat)}</span>
                          {isOvernight(shift.startTime, shift.endTime) && (
                            <span className="inline-flex items-center rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[11px] font-medium tracking-wide">
                              Overnight
                            </span>
                          )}
                        </p>
                      )}
                      {shift.description && (
                        <p className="text-sm text-muted-foreground pt-1 whitespace-pre-wrap">{shift.description}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditShiftClick(shift)}>
                        <Edit className="h-4 w-4 icon-lg" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteShiftClick(shift)}>
                        <Trash2 className="h-4 w-4 icon-lg" />
                      </Button>
                    </div>
                  </div>
                  {index < groupShifts.length - 1 && <Separator className="mt-4" />}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      );
    })
  );

  if (shifts.length === 0 && !activeShift && projectPeriods.length === 0) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 sm:p-6 border-b border-border/50 bg-card/50 sticky top-0 backdrop-blur-sm z-10">
                <div className="max-w-[512px] w-full mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                            <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground font-headline">{project.name}</h1>
                            <div className="font-bold text-foreground">
                              {hourFormat === 'decimal' ? (
                                <div className="text-xl flex items-center gap-3">
                                  <span>
                                    {totalHours.toFixed(2)}
                                    <span className="ml-1.5 text-base font-normal text-muted-foreground"> Hours</span>
                                  </span>
                                  {showTotalProjectHoursOnCards && (
                                    <span className="flex items-center gap-3">
                                      <span className="inline-block w-px h-5 bg-border" aria-hidden="true"></span>
                                      <span className="text-lg font-normal text-muted-foreground/80">
                                        <span className="font-bold text-foreground">{allProjectHours.toFixed(2)}</span>
                                        <span className="ml-1.5 text-sm font-normal"> Total Project Hours</span>
                                      </span>
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <HeaderContext.Provider value={true}>
                                    {formatHours(totalHours, hourFormat, true)}
                                  </HeaderContext.Provider>
                                  {showTotalProjectHoursOnCards && (
                                    <span className="flex items-center gap-3">
                                      <span className="inline-block w-px h-5 bg-border" aria-hidden="true"></span>
                                      <span className="text-lg font-normal text-muted-foreground/80">
                                        <span className="font-bold text-foreground">{allProjectHours.toFixed(2)}</span>
                                        <span className="ml-1.5 text-sm font-normal"> Total Project Hours</span>
                                      </span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        {/* Periods render on-page above current shifts; no toggle needed */}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={activeShift ? 'Stop active shift' : 'Start shift'}
                          className="h-8 w-8"
                          onClick={() => {
                            const current = activeShift as ActiveShift | undefined;
                            if (current?.id) {
                              endShift(current.id);
                            } else {
                              handleStartShift();
                            }
                          }}
                        >
                          <Clock className={`h-5 w-5 ${activeShift ? 'text-red-600' : 'text-green-600'}`} />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsProjectDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Project Name</span>
                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportToText}>
                                    <ClipboardCopy className="mr-2 h-4 w-4" />
                                    <span>Export to Text</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsProjectDeleteAlertOpen(true)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete Project</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
            <main className="flex-1 w-full max-w-[512px] mx-auto px-4 sm:px-6 pt-2 sm:pt-3 pb-24 flex items-center justify-center">
                 <NewShiftDialog 
                    projectId={projectId} 
                    open={isShiftDialogOpen} 
                    onOpenChange={handleShiftDialogStateChange} 
                    shiftToEdit={shiftToEdit}
                    allShifts={allShifts}
                    activeShift={activeShift || null}
                    periodId={null}
                  >
                      <Button
                      size="icon"
                      className="fab-inset h-14 w-14 rounded-full shadow-lg z-20"
                      onClick={() => handleShiftDialogStateChange(true)}
                      >
                      <Plus className="h-6 w-6" />
                      </Button>
                  </NewShiftDialog>
            </main>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <NewProjectDialog projectToEdit={project} open={isProjectDialogOpen} onOpenChange={handleProjectDialogStateChange}>
         {/* Trigger is handled elsewhere; provide a fallback element to satisfy required children prop */}
         <span className="sr-only">Project Dialog</span>
       </NewProjectDialog>
      <header className="p-4 sm:p-6 border-b border-border/50 bg-card/50 sticky top-0 backdrop-blur-sm z-10">
  <div className="max-w-[512px] w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground font-headline">{project.name}</h1>
                 <div className="font-bold text-foreground">
                   {hourFormat === 'decimal' ? (
                      <div className="text-xl flex items-center gap-3">
                        <span>
                          {totalHours.toFixed(2)}
                          <span className="ml-1.5 text-base font-normal text-muted-foreground"> Hours</span>
                        </span>
                        {showTotalProjectHoursOnCards && (
                          <span className="flex items-center gap-3">
                            <span className="inline-block w-px h-5 bg-border" aria-hidden="true"></span>
                            <span className="text-lg font-normal text-muted-foreground/80">
                              <span className="font-bold text-foreground">{allProjectHours.toFixed(2)}</span>
                              <span className="ml-1.5 text-sm font-normal"> Total Project Hours</span>
                            </span>
                          </span>
                        )}
                      </div>
                   ) : (
                      <div className="flex items-center gap-3">
                        <HeaderContext.Provider value={true}>
                          {formatHours(totalHours, hourFormat, true)}
                        </HeaderContext.Provider>
                        {showTotalProjectHoursOnCards && (
                          <span className="flex items-center gap-3">
                            <span className="inline-block w-px h-5 bg-border" aria-hidden="true"></span>
                            <span className="text-lg font-normal text-muted-foreground/80">
                              <span className="font-bold text-foreground">{allProjectHours.toFixed(2)}</span>
                              <span className="ml-1.5 text-sm font-normal"> Total Project Hours</span>
                            </span>
                          </span>
                        )}
                      </div>
                   )}
                 </div>
            </div>
          </div>
           <div className="flex items-center gap-2">
              {/* Past Periods are rendered inline below */}
              <Button
                variant="ghost"
                size="icon"
                aria-label={activeShift ? 'Stop active shift' : 'Start shift'}
                className="h-8 w-8"
                onClick={() => {
                  const current = activeShift as ActiveShift | undefined;
                  if (current?.id) {
                    endShift(current.id);
                  } else {
                    handleStartShift();
                  }
                }}
              >
                <Clock className={`h-5 w-5 ${activeShift ? 'text-red-600' : 'text-green-600'}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsProjectDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Project Name</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => consolidateCurrentPeriod(project.id)}>
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    <span>Consolidate Period</span>
                  </DropdownMenuItem>
                  {projectPeriods.length > 0 && (
                    <DropdownMenuItem onClick={() => project && setProjectShowPastPeriods(project.id, !(project.showPastPeriods ?? true))}>
                      <Layers className="mr-2 h-4 w-4" />
                      <span>{(project.showPastPeriods ?? true) ? 'Hide Past Periods' : 'Show Past Periods'}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleExportToText}>
                      <ClipboardCopy className="mr-2 h-4 w-4" />
                      <span>Export to Text</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchiveToggle}>
                      {project.archived ? (
                        <>
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          <span>Unarchive</span>
                        </>
                      ) : (
                        <>
                          <Archive className="mr-2 h-4 w-4" />
                          <span>Archive</span>
                        </>
                      )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsProjectDeleteAlertOpen(true)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div>
      </header>

  <main className={`flex-1 w-full max-w-[512px] mx-auto px-4 sm:px-6 ${((project.showPastPeriods ?? true) && projectPeriods.length > 0) ? 'pt-0' : 'pt-2 sm:pt-3'} pb-24`}>
        <div className="space-y-6">
            {((project.showPastPeriods ?? true) && projectPeriods.length > 0) && (
              <div>
                <div className="-mx-4 sm:-mx-6">
                  <Accordion
                    type="multiple"
                    className="w-full space-y-0 divide-y divide-border border-y border-border"
                  >
                  {[...projectPeriods].reverse().map((per) => {
                    const periodShiftsForPer = allShifts.filter(s => s.projectId === projectId && s.periodId === per.id);
                    const hours = periodShiftsForPer.reduce((acc, s) => acc + s.hours, 0);
                    const uniqueDates = Array.from(new Set(periodShiftsForPer.map(s => s.date).filter(Boolean)));
                    let dateLabel: string;
                    if (uniqueDates.length === 0) {
                      try { dateLabel = format(parseISO(per.createdAt), 'MM/dd/yyyy'); } catch { dateLabel = '—'; }
                    } else if (uniqueDates.length === 1) {
                      dateLabel = format(parseISO(uniqueDates[0]!), 'MM/dd/yyyy');
                    } else {
                      const sorted = [...uniqueDates].sort();
                      const first = format(parseISO(sorted[0]!), 'MM/dd/yyyy');
                      const last = format(parseISO(sorted[sorted.length - 1]!), 'MM/dd/yyyy');
                      dateLabel = `${first} - ${last}`;
                    }
                    const dayGroups = Object.entries(periodShiftsForPer.reduce((acc, shift) => {
                      const dayKey = shift.date;
                      acc[dayKey] ||= [] as Shift[];
                      acc[dayKey].push(shift);
                      return acc;
                    }, {} as Record<string, Shift[]>))
                      .sort(([a],[b]) => (a < b ? -1 : a > b ? 1 : 0))
                      .map(([day, list]) => {
                        const sortedShifts = [...list].sort((s1, s2) => minutesFromTime(s1.startTime) - minutesFromTime(s2.startTime));
                        return [day, sortedShifts] as const;
                      });
                    return (
                      <AccordionItem value={per.id} key={per.id} className="border-0 odd:bg-muted/40 even:bg-background">
                        <AccordionPrimitive.Header className="flex items-center">
                          <AccordionPrimitive.Trigger className="group flex flex-1 items-center justify-between px-4 sm:px-6 py-2 text-base font-semibold hover:no-underline">
                            <div className="flex items-center gap-2 min-w-0">
                              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                              <span className="truncate pr-2">{dateLabel}</span>
                            </div>
                            <span className="text-sm text-muted-foreground flex items-baseline gap-1">
                              <span className="text-foreground font-medium">{hours.toFixed(2)}</span>
                            </span>
                          </AccordionPrimitive.Trigger>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="px-3 py-2 text-foreground/80 hover:text-foreground"
                                aria-label="Period actions"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem
                                onClick={() => {
                                  try {
                                    const lines: string[] = [];
                                    lines.push(`${project.name} — ${dateLabel}`);
                                    lines.push('--------------------');
                                    const sorted = [...periodShiftsForPer]
                                      .filter(s => !!s.date)
                                      .sort((a, b) => {
                                        if (a.date! < b.date!) return -1;
                                        if (a.date! > b.date!) return 1;
                                        return minutesFromTime(a.startTime) - minutesFromTime(b.startTime);
                                      });
                                    let lastDay = '';
                                    for (const s of sorted) {
                                      if (s.date !== lastDay) {
                                        lines.push('');
                                        lines.push(format(parseISO(s.date!), 'MMMM do, yyyy'));
                                        lastDay = s.date!;
                                      }
                                      lines.push(`  ${s.startTime ?? '—'} – ${s.endTime ?? '—'}`);
                                      lines.push(`  ${s.hours.toFixed(2)} hours`);
                                      if (s.description) lines.push(`  Description: ${s.description}`);
                                    }
                                    const text = lines.join('\n').trim();
                                    navigator.clipboard.writeText(text)
                                      .then(() => {
                                        toast({ title: 'Copied to clipboard!' });
                                      })
                                      .catch((err) => {
                                        console.error('Failed to copy text: ', err);
                                        toast({ title: 'Failed to copy text', description: 'Could not copy text to clipboard.', variant: 'destructive' });
                                      });
                                  } catch (err) {
                                    console.error('Export error:', err);
                                    toast({ title: 'Export failed', description: 'An error occurred while preparing the export.', variant: 'destructive' });
                                  }
                                }}
                              >
                                <ClipboardCopy className="mr-2 h-4 w-4" />
                                <span>Export to Text</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => project && revertPeriod(project.id, per.id)}>
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                <span>Revert to Current Shifts</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setPeriodToDelete(per)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Period</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </AccordionPrimitive.Header>
                        <AccordionContent className="!pt-0 px-0 pb-4">
                          {periodShiftsForPer.length > 0 ? (
                            <div className="px-4 sm:px-6">
                              <table className="w-full text-[13px] border-collapse">
                                <tbody>
                                  {[...periodShiftsForPer]
                                    .filter(s => !!s.date)
                                    .sort((a, b) => {
                                      if (a.date! < b.date!) return -1;
                                      if (a.date! > b.date!) return 1;
                                      return minutesFromTime(a.startTime) - minutesFromTime(b.startTime);
                                    })
                                    .map((shift) => {
                                      const dateCell = format(parseISO(shift.date!), 'MM/dd/yyyy');
                                      const inCell = shift.startTime ? formatTime(shift.startTime, timeFormat) : '—';
                                      const outCell = shift.endTime ? formatTime(shift.endTime, timeFormat) : '—';
                                      const totalMinutes = Math.round(shift.hours * 60);
                                      const h = Math.floor(totalMinutes / 60);
                                      const m = totalMinutes % 60;
                                      const descriptive = h > 0 ? `${h} ${h > 1 ? 'hours' : 'hour'}${m > 0 ? `, ${m} ${m > 1 ? 'minutes' : 'minute'}` : ''}` : `${m} ${m > 1 ? 'minutes' : 'minute'}`;
                                      const hoursText = hourFormat === 'decimal' ? shift.hours.toFixed(2) : (hourFormat === 'hhmm' ? descriptive : `${shift.hours.toFixed(2)} (${descriptive})`);
                                      return (
                                        <tr key={shift.id} className="odd:bg-muted/40">
                                          <td className="py-2 pr-2 whitespace-nowrap align-middle">{dateCell}</td>
                                          <td className="py-2 px-2 whitespace-nowrap align-middle">{inCell} – {outCell}</td>
                                          <td className="py-2 px-2 whitespace-nowrap align-middle text-right">{hoursText}</td>
                                          <td className="py-2 pl-2 whitespace-nowrap align-middle text-right">
                                            <div className="flex items-center justify-end gap-1">
                                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditShiftClick(shift)}>
                                                <Edit className="h-3 w-3 icon-lg" />
                                              </Button>
                                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteShiftClick(shift)}>
                                                <Trash2 className="h-3 w-3 icon-lg" />
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground px-4 sm:px-6">No shifts recorded in this period.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                  </Accordion>
                </div>
              </div>
            )}
            {shiftsGroupedByMonth.length > 0 && (
              <div className="space-y-1">
                {((project.showPastPeriods ?? true) && projectPeriods.length > 0) && (
                  <h2 className="text-sm font-semibold text-center text-muted-foreground py-0">Current Shifts</h2>
                )}
                {shiftsGroupedByMonth.length > 1 ? (
                  <Accordion type="multiple" defaultValue={defaultAccordionValue} className="w-full space-y-4">
                    {shiftsGroupedByMonth.map(([month, dayGroups]) => (
                      <AccordionItem value={month} key={month} className="border-none">
                        <AccordionTrigger className="text-xl font-bold font-headline text-foreground hover:no-underline -mb-2">
                          {format(parseISO(month), "MMMM yyyy")}
                        </AccordionTrigger>
                        <AccordionContent className="!pt-4 space-y-4">
                          {renderShiftGroups(dayGroups)}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="space-y-4">
                    {shiftsGroupedByMonth.flatMap(([, dayGroups]) => renderShiftGroups(dayGroups))}
                  </div>
                )}
              </div>
            )}
            {activeShift && (
              <ActiveShiftCard activeShift={activeShift} onStop={() => endShift(activeShift.id)} />
            )}
          </div>
      </main>

      <NewShiftDialog 
        projectId={projectId} 
        open={isShiftDialogOpen} 
        onOpenChange={handleShiftDialogStateChange} 
        shiftToEdit={shiftToEdit}
        allShifts={allShifts}
        activeShift={activeShift || null}
        periodId={null}
      >
        <Button
          size="icon"
          className="fab-inset h-14 w-14 rounded-full shadow-lg z-20"
          onClick={() => setIsShiftDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </NewShiftDialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the shift.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex items-center space-x-2 my-4">
                  <Checkbox id="dont-ask-again" checked={dontAskAgain} onCheckedChange={(checked: boolean | "indeterminate") => setDontAskAgain(Boolean(checked))} />
                  <Label htmlFor="dont-ask-again" className="text-sm font-normal">Don&apos;t ask me again</Label>
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDeleteShift}>Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
  <AlertDialog open={!!groupToDelete} onOpenChange={(open: boolean) => !open && setGroupToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete All Shifts?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all shifts for {groupToDelete && format(parseISO(groupToDelete), "PPP")}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteGroup}>Delete All</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isProjectDeleteAlertOpen} onOpenChange={setIsProjectDeleteAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project and all of its associated shifts.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDeleteProject}>Delete Project</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!periodToDelete} onOpenChange={(open: boolean) => !open && setPeriodToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Period?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this period and all of its shifts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (project && periodToDelete) {
                deletePeriod(project.id, periodToDelete.id);
                setPeriodToDelete(null);
              }
            }}>Delete Period</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
