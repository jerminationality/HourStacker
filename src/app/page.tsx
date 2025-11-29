
"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { useAppData } from "@/contexts/AppDataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Settings, Hourglass, ArrowUpDown, Archive, MoreVertical, ClipboardCopy, ArchiveRestore } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Project, Shift } from "@/lib/types";
import { formatHours, formatHoursForExport, formatShiftRange, maybeRoundHours } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { ProjectSortBy, SortDir } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Home() {
  const { projects, shifts, deleteProject, archiveProject, unarchiveProject, getShiftsByProjectId } = useAppData();
  const { hourFormat, timeFormat, projectSortBy, projectSortDir, setProjectSortBy, setProjectSortDir, showTotalProjectHoursOnCards, roundTotalsToQuarterHours } = useSettings();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  const { toast } = useToast();
  const headerIconClasses = "text-foreground/80 hover:text-foreground transition-colors hover:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0 data-[state=open]:bg-transparent";

  // Unconsolidated (current) hours exclude shifts with a periodId (i.e., current period only)
  const getProjectCurrentHours = (projectId: string) => {
    const sum = shifts
      .filter((shift: Shift) => shift.projectId === projectId && !shift.periodId)
      .reduce((acc: number, shift: Shift) => acc + shift.hours, 0);
    return maybeRoundHours(sum, roundTotalsToQuarterHours);
  };
  // Total project hours include all shifts (consolidated + current)
  const getProjectTotalHours = (projectId: string) => {
    const sum = shifts
      .filter((shift: Shift) => shift.projectId === projectId)
      .reduce((acc: number, shift: Shift) => acc + shift.hours, 0);
    return maybeRoundHours(sum, roundTotalsToQuarterHours);
  };
  
  const activeProjects = projects.filter(p => !p.archived);
  const sortedProjects = [...activeProjects].sort((a, b) => {
    const dir = projectSortDir === 'asc' ? 1 : -1;
    if (projectSortBy === 'name') {
      return a.name.localeCompare(b.name) * dir;
    }
    if (projectSortBy === 'createdAt') {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (aTime - bTime) * dir;
    }
    // totalHours
  const aHours = getProjectTotalHours(a.id); // Sorting still uses total hours
  const bHours = getProjectTotalHours(b.id);
    return (aHours - bHours) * dir;
  });
  
  const handleEditClick = (_e: MouseEvent, project: Project) => {
    // click handled on button; prevent link navigation
    setProjectToEdit(project);
    setIsNewProjectDialogOpen(true);
  };

  const handleDeleteClick = (_e: MouseEvent, project: Project) => {
    // click handled on button; prevent link navigation
    setProjectToDelete(project);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setIsAlertOpen(false);
      setProjectToDelete(null);
    }
  };
  
  const handleDialogStateChange = (open: boolean) => {
    setIsNewProjectDialogOpen(open);
    if (!open) {
      setProjectToEdit(null);
    }
  }

  const handleExportProjectToText = (project: Project) => {
    const projectShifts = getShiftsByProjectId(project.id);
  const total = maybeRoundHours(projectShifts.reduce((acc, s) => acc + s.hours, 0), roundTotalsToQuarterHours);
    let exportText = `${project.name}\n`;
    if (hourFormat === 'decimal') {
      exportText += `${total.toFixed(2)} Total Hours\n`;
    } else {
      exportText += `${formatHoursForExport(total, 0)}\n`;
    }
    exportText += "--------------------\n\n";

    const byDate: Record<string, Shift[]> = {};
    for (const s of projectShifts) {
      const arr = (byDate[s.date] ||= []);
      arr.push(s);
    }
    const dates = Object.keys(byDate).sort();
    for (const d of dates) {
      exportText += `${format(parseISO(d), "MMMM do, yyyy")}\n`;
      const list = byDate[d] ?? [];
      for (const s of list) {
        exportText += `  ${formatShiftRange(s.startTime, s.endTime, timeFormat)}\n`;
        if (hourFormat === 'decimal') {
          exportText += `  ${s.hours.toFixed(2)} hours\n`;
        } else {
          exportText += `  ${formatHoursForExport(s.hours, 2, true)}\n`;
        }
        if (s.description) exportText += `  Description: ${s.description}\n`;
        exportText += `\n`;
      }
    }

    navigator.clipboard.writeText(exportText.trim())
      .then(() => toast({ title: "Copied to clipboard!" }))
      .catch(() => toast({ title: "Failed to copy text", description: "Could not copy to clipboard.", variant: "destructive" }));
  };

  if (activeProjects.length === 0) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
         <header className="p-4 sm:py-3 sm:px-6 border-b border-border/50 bg-card/50 sticky top-0 backdrop-blur-sm z-10">
                <div className="max-w-[512px] w-full mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Hourglass className="h-7 w-7 text-orange-500 translate-y-[1px]" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-headline">HourStacker</h1>
                    </div>
                  <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label="View archived" className={headerIconClasses}>
                      <Link href="/archive"><Archive className="h-4 w-4" /></Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Sort projects"
                          className={`${headerIconClasses} data-[state=open]:bg-accent data-[state=open]:text-white data-[state=open]:hover:bg-accent data-[state=open]:hover:text-white`}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={projectSortBy} onValueChange={(v: string) => setProjectSortBy(v as ProjectSortBy)}>
                          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="createdAt">Date Created</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="totalHours">Total Hours</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Order</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={projectSortDir} onValueChange={(v: string) => setProjectSortDir(v as SortDir)}>
                          <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <SettingsDialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                      <Button variant="ghost" size="icon" className={headerIconClasses} onClick={() => setIsSettingsDialogOpen(true)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </SettingsDialog>
                  </div>
                </div>
            </header>
      <main className="flex-1 w-full max-w-[512px] mx-auto p-4 sm:p-6 pb-24 flex items-center justify-center">
                 <NewProjectDialog open={isNewProjectDialogOpen} onOpenChange={handleDialogStateChange} projectToEdit={projectToEdit}>
                    <Button
                    size="icon"
                    className="fab-inset h-14 w-14 rounded-full shadow-lg z-20"
                    onClick={() => handleDialogStateChange(true)}
                    >
                    <Plus className="h-6 w-6" />
                    </Button>
                </NewProjectDialog>
  {/* Archive is a dedicated page now */}
            </main>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 sm:py-3 sm:px-6 border-b border-border/50 bg-card/50 sticky top-0 backdrop-blur-sm z-10">
  <div className="max-w-[512px] w-full mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Hourglass className="h-6 w-6 text-orange-500 translate-y-[1px]" />
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-headline">HourStacker</h1>
            </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" aria-label="View archived" className={headerIconClasses}>
              <Link href="/archive"><Archive className="h-4 w-4" /></Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Sort projects"
                  className={`${headerIconClasses} data-[state=open]:bg-accent data-[state=open]:text-white data-[state=open]:hover:bg-accent data-[state=open]:hover:text-white`}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={projectSortBy} onValueChange={(v: string) => setProjectSortBy(v as ProjectSortBy)}>
                  <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="createdAt">Date Created</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="totalHours">Total Hours</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={projectSortDir} onValueChange={(v: string) => setProjectSortDir(v as SortDir)}>
                  <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <SettingsDialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
              <Button variant="ghost" size="icon" className={headerIconClasses} onClick={() => setIsSettingsDialogOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            </SettingsDialog>
          </div>
        </div>
      </header>

  <main className="flex-1 w-full max-w-[512px] mx-auto p-4 sm:p-6 pb-24">
  <div className="grid grid-cols-1 gap-4">{/* Removed viewport breakpoints so layout is wrapper-width dependent */}
  {sortedProjects.map((project) => (
            <Link key={project.id} href={`/project/${project.id}`} className="block">
                <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors duration-200 group relative">
                    <div className="absolute top-2 right-2 z-10 flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.preventDefault()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e: MouseEvent) => { e.preventDefault(); handleEditClick(e, project); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); if (project.archived) { unarchiveProject(project.id); } else { archiveProject(project.id); } }}>
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
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleExportProjectToText(project); }}>
                            <ClipboardCopy className="mr-2 h-4 w-4" />
                            <span>Export to Text</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e: MouseEvent) => { e.preventDefault(); handleDeleteClick(e, project); }} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Project</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardHeader>
                    <CardTitle className="font-headline pr-16">{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                        {formatHours(getProjectCurrentHours(project.id), hourFormat, false)}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-3">
                          <span>Current Hours</span>
                          {showTotalProjectHoursOnCards && (
                            <span className="flex items-center gap-2">
                              <span className="inline-block w-px h-5 bg-border" aria-hidden="true"></span>
                              <span className="text-foreground font-bold">{getProjectTotalHours(project.id).toFixed(2)}</span>
                              <span className="text-muted-foreground">Total Project Hours</span>
                            </span>
                          )}
                        </p>
                    </CardContent>
                </Card>
            </Link>
        ))}
        </div>
      </main>

      <NewProjectDialog open={isNewProjectDialogOpen} onOpenChange={handleDialogStateChange} projectToEdit={projectToEdit}>
        <Button
          size="icon"
          className="fab-inset h-14 w-14 rounded-full shadow-lg z-20"
          onClick={() => handleDialogStateChange(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </NewProjectDialog>
  {/* Archive is a dedicated page now */}
      
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project and all its shifts.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
