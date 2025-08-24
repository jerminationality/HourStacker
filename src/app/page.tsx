
"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { useAppData } from "@/contexts/AppDataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Settings, Hourglass, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Project, Shift } from "@/lib/types";
import { formatHours } from "@/lib/utils";
import type { ProjectSortBy, SortDir } from "@/contexts/SettingsContext";
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
  const { projects, shifts, deleteProject } = useAppData();
  const { hourFormat, projectSortBy, projectSortDir, setProjectSortBy, setProjectSortDir } = useSettings();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const getProjectTotalHours = (projectId: string) => {
    return shifts
      .filter((shift: Shift) => shift.projectId === projectId)
      .reduce((acc: number, shift: Shift) => acc + shift.hours, 0);
  };
  
  const sortedProjects = [...projects].sort((a, b) => {
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
    const aHours = getProjectTotalHours(a.id);
    const bHours = getProjectTotalHours(b.id);
    return (aHours - bHours) * dir;
  });
  
  const handleEditClick = (e: MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToEdit(project);
    setIsNewProjectDialogOpen(true);
  };

  const handleDeleteClick = (e: MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
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

  if (projects.length === 0) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
         <header className="p-4 sm:py-3 sm:px-6 border-b border-border/50 bg-card/50 sticky top-0 backdrop-blur-sm z-10">
                <div className="max-w-[512px] w-full mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Hourglass className="h-6 w-6 text-orange-500" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-headline">HourStacker</h1>
                    </div>
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Sort projects">
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={projectSortBy} onValueChange={(v: ProjectSortBy) => setProjectSortBy(v)}>
                          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="createdAt">Date Created</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="totalHours">Total Hours</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Direction</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={projectSortDir} onValueChange={(v: SortDir) => setProjectSortDir(v)}>
                          <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <SettingsDialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                      <Button variant="ghost" size="icon" onClick={() => setIsSettingsDialogOpen(true)}>
                        <Settings />
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
            </main>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 sm:py-3 sm:px-6 border-b border-border/50 bg-card/50 sticky top-0 backdrop-blur-sm z-10">
  <div className="max-w-[512px] w-full mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Hourglass className="h-6 w-6 text-orange-500" />
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-headline">HourStacker</h1>
            </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Sort projects">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={projectSortBy} onValueChange={(v: ProjectSortBy) => setProjectSortBy(v)}>
                  <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="createdAt">Date Created</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="totalHours">Total Hours</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Direction</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={projectSortDir} onValueChange={(v: SortDir) => setProjectSortDir(v)}>
                  <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <SettingsDialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
              <Button variant="ghost" size="icon" onClick={() => setIsSettingsDialogOpen(true)}>
                <Settings />
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
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEditClick(e, project)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={(e) => handleDeleteClick(e, project)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
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
