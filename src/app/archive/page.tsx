"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { MouseEvent } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { useSettings } from "@/contexts/SettingsContext";
import type { ProjectSortBy, SortDir } from "@/contexts/SettingsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hourglass, ArrowUpDown, Settings, Archive, MoreVertical, Edit, ClipboardCopy, Trash2, ArchiveRestore } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import type { Project, Shift } from "@/lib/types";
import { formatHours, formatHoursForExport, formatShiftRange, maybeRoundHours } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function ArchivePage() {
  const { projects, shifts, deleteProject, archiveProject, unarchiveProject, getShiftsByProjectId } = useAppData();
  const { hourFormat, timeFormat, projectSortBy, projectSortDir, setProjectSortBy, setProjectSortDir, roundTotalsToQuarterHours } = useSettings();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const { toast } = useToast();
  const headerIconClasses = "text-foreground/80 hover:text-foreground transition-colors hover:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0 data-[state=open]:bg-transparent";

  const archivedProjects = useMemo(() => projects.filter(p => p.archived).sort((a, b) => a.name.localeCompare(b.name)), [projects]);

  const grouped = useMemo(() => {
    const groups: Record<string, Project[]> = {};
    for (const p of archivedProjects) {
      const key = (p.name?.[0] || '#').toUpperCase();
      groups[key] ||= [];
      groups[key].push(p);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([k, arr]) => [k, arr] as const);
  }, [archivedProjects]);

  const useAccordion = useMemo(() => {
    const letters = new Set(archivedProjects.map(p => (p.name?.[0] || '#').toUpperCase()));
    return archivedProjects.length > 5 && letters.size > 1;
  }, [archivedProjects]);

  const getProjectTotalHours = (projectId: string) => maybeRoundHours(
    shifts.filter(s => s.projectId === projectId).reduce((acc, s) => acc + s.hours, 0),
    roundTotalsToQuarterHours
  );

  const handleEditClick = (_e: MouseEvent, project: Project) => {
    setProjectToEdit(project);
    setIsNewProjectDialogOpen(true);
  };

  const handleDeleteClick = (_e: MouseEvent, project: Project) => {
    setProjectToDelete(project);
    setIsAlertOpen(true);
  };

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
      const list = byDate[d] ?? [];
      exportText += `${format(parseISO(d), "MMMM do, yyyy")}\n`;
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
      .then(() => toast({ title: 'Copied to clipboard!' }))
      .catch(() => toast({ title: 'Failed to copy text', variant: 'destructive' }));
  };

  const handleDialogStateChange = (open: boolean) => {
    setIsNewProjectDialogOpen(open);
    if (!open) setProjectToEdit(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 sm:py-3 sm:px-6 border-b border-border/50 bg-card/50 sticky top-0 backdrop-blur-sm z-10">
        <div className="max-w-[512px] w-full mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Hourglass className="h-6 w-6 text-orange-500" />
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-headline">HourStacker</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" aria-label="Back to projects" className="bg-accent hover:bg-accent text-white focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0">
              <Link href="/"><Archive className="h-4 w-4 text-white" /></Link>
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

      <main className="flex-1 w-full max-w-[512px] mx-auto pt-1 pr-4 pl-4 sm:pt-1 sm:pr-6 sm:pl-6 pb-24">
        <h2 className="text-center text-xs font-semibold tracking-wide text-muted-foreground mb-1">Archived Projects</h2>
        {archivedProjects.length === 0 ? (
          <p className="text-center text-muted-foreground">No archived projects.</p>
        ) : useAccordion ? (
          <Accordion type="multiple" className="w-full space-y-3">
            {grouped.map(([letter, list]) => (
              <AccordionItem key={letter} value={letter} className="border-none">
                <AccordionTrigger className="text-base font-semibold font-headline text-foreground hover:no-underline">
                  {letter}
                </AccordionTrigger>
                <AccordionContent className="!pt-2 space-y-2">
                  {list.map((project) => (
                    <Link key={project.id} href={`/project/${project.id}`} className="block">
                      <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader className="py-2 px-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="font-headline text-base">{project.name}</CardTitle>
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e: MouseEvent) => e.preventDefault()}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e: MouseEvent) => { e.preventDefault(); handleEditClick(e, project); }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e: MouseEvent) => { e.preventDefault(); unarchiveProject(project.id); }}>
                                    <ArchiveRestore className="mr-2 h-4 w-4" />
                                    <span>Unarchive</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e: MouseEvent) => { e.preventDefault(); handleExportProjectToText(project); }}>
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
                          </div>
                        </CardHeader>
                        <CardContent className="py-1 px-3 pb-3 text-sm text-muted-foreground">
                          {formatHours(getProjectTotalHours(project.id), hourFormat, true)} total
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {archivedProjects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`} className="block">
                <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors duration-200 group relative">
                  <div className="absolute top-2 right-2 z-10 flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e: MouseEvent) => e.preventDefault()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e: MouseEvent) => { e.preventDefault(); handleEditClick(e, project); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e: MouseEvent) => { e.preventDefault(); unarchiveProject(project.id); }}>
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          <span>Unarchive</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e: MouseEvent) => { e.preventDefault(); handleExportProjectToText(project); }}>
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
                      {formatHours(getProjectTotalHours(project.id), hourFormat, false)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <NewProjectDialog open={isNewProjectDialogOpen} onOpenChange={handleDialogStateChange} projectToEdit={projectToEdit}>
        <span className="sr-only">Project Dialog</span>
      </NewProjectDialog>
    </div>
  );
}
