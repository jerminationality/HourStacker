
"use client";

import { useState, useMemo, useEffect, useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppData } from '@/contexts/AppDataContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewShiftDialog } from '@/components/NewShiftDialog';
import { ArrowLeft, Plus, Calendar, Edit, Trash2, MoreVertical, Clock, ClipboardCopy } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Shift, Project, ActiveShift } from '@/lib/types';
import { formatHours, formatTime, HeaderContext, formatHoursForExport, formatShiftRange, isOvernight } from '@/lib/utils';
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

export default function ProjectPage() {
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<Shift | null>(null);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isProjectDeleteAlertOpen, setIsProjectDeleteAlertOpen] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [defaultAccordionValue, setDefaultAccordionValue] = useState<string[]>([]);

  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { timeFormat, hourFormat, confirmDeleteShift, setConfirmDeleteShift: setConfirmDelete } = useSettings();
  const { 
    getProjectById, 
    getShiftsByProjectId, 
    isInitialized, 
    deleteShift, 
    deleteShiftsByDate,
    deleteProject,
    startShift,
    endShift,
    getActiveShift,
    shifts: allShifts
  } = useAppData();
  
  const projectIdRaw = (params as Record<string, string | string[]>)["id"];
  const projectId = typeof projectIdRaw === 'string' ? projectIdRaw : '';
  const project = getProjectById(projectId);
  const shifts = getShiftsByProjectId(projectId);
  const activeShift = getActiveShift(projectId);
  const isHeader = useContext(HeaderContext);

  const handleStartShift = () => {
    if (!activeShift) {
      startShift(projectId);
    }
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
    const monthGroups = shifts
      .filter(shift => shift.date)
      .reduce((acc, shift) => {
        const monthKey = format(parseISO(shift.date), 'yyyy-MM');
        if (!acc[monthKey]) {
          acc[monthKey] = {};
        }

        const dayKey = format(parseISO(shift.date), 'yyyy-MM-dd');
        if (!acc[monthKey][dayKey]) {
          acc[monthKey][dayKey] = [];
        }
        acc[monthKey][dayKey].push(shift);
        return acc;
      }, {} as Record<string, Record<string, Shift[]>>);

    const sortedMonths = Object.entries(monthGroups)
      .sort(([monthA], [monthB]) => new Date(monthA).getTime() - new Date(monthB).getTime())
      .map(([month, dayGroups]) => {
        const sortedDays = Object.entries(dayGroups)
          .sort(([dayA], [dayB]) => parseISO(dayA).getTime() - parseISO(dayB).getTime());
        return [month, sortedDays] as const;
      });

    return sortedMonths;
  }, [shifts]);

  const monthCount = shiftsGroupedByMonth.length;
  useEffect(() => {
    const last = shiftsGroupedByMonth[shiftsGroupedByMonth.length - 1];
    if (last) {
      setDefaultAccordionValue([last[0]]);
    }
  }, [monthCount]);
  
  const totalHours = useMemo(() => {
    return shifts.reduce((acc, shift) => acc + shift.hours, 0);
  }, [shifts]);

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

  const renderShiftGroups = (dayGroups: readonly (readonly [string, Shift[]])[]) => (
    dayGroups.map(([groupName, groupShifts]) => (
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
                    {shift.description && <p className="text-sm text-muted-foreground pt-1">{shift.description}</p>}
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
    ))
  );

  if (shifts.length === 0 && !activeShift) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 sm:p-6 border-b border-border/50 bg-card/50 sticky top-0 backdrop-blur-sm z-10">
        <div className="app-shell flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                            <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground font-headline">{project.name}</h1>
                            <div className="font-bold text-foreground">
                              <HeaderContext.Provider value={true}>
                                {formatHours(totalHours, hourFormat, true)}
                              </HeaderContext.Provider>
                            </div>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        { !activeShift && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleStartShift}>
                                <Clock className="h-5 w-5 text-green-600" />
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsProjectDialogOpen(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit Project</span>
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
            <main className="flex-1 w-full app-shell p-4 sm:p-6 pb-24 flex items-center justify-center">
                 <NewShiftDialog 
                    projectId={projectId} 
                    open={isShiftDialogOpen} 
                    onOpenChange={handleShiftDialogStateChange} 
                    shiftToEdit={shiftToEdit}
                    allShifts={allShifts}
                    activeShift={activeShift || null}
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
        <div className="app-shell flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground font-headline">{project.name}</h1>
                 <div className="font-bold text-foreground">
                    <HeaderContext.Provider value={true}>
                        {formatHours(totalHours, hourFormat, true)}
                    </HeaderContext.Provider>
                </div>
            </div>
          </div>
           <div className="flex items-center gap-2">
              { !activeShift && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleStartShift}>
                      <Clock className="h-5 w-5 text-green-600" />
                  </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsProjectDialogOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit Project</span>
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

  <main className="flex-1 w-full app-shell p-4 sm:p-6 pb-24">
        <div className="space-y-6">
            {activeShift && (
              <ActiveShiftCard activeShift={activeShift} onStop={() => endShift(activeShift.id)} />
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
      </main>
      
      <NewShiftDialog 
        projectId={projectId} 
        open={isShiftDialogOpen} 
        onOpenChange={handleShiftDialogStateChange} 
        shiftToEdit={shiftToEdit}
        allShifts={allShifts}
  activeShift={activeShift || null}
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
                  <Checkbox id="dont-ask-again" checked={dontAskAgain} onCheckedChange={(checked) => setDontAskAgain(checked as boolean)} />
                  <Label htmlFor="dont-ask-again" className="text-sm font-normal">Don&apos;t ask me again</Label>
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDeleteShift}>Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
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
    </div>
  );
}
