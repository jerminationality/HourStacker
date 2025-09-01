"use client";

import Link from "next/link";
import { useAppData } from "@/contexts/AppDataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHours } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";

interface ArchivedProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchivedProjectsDialog({ open, onOpenChange }: ArchivedProjectsDialogProps) {
  const { projects, shifts } = useAppData();
  const { hourFormat } = useSettings();
  const archived = projects.filter(p => p.archived);

  const getProjectTotalHours = (projectId: string) =>
    shifts.filter(s => s.projectId === projectId).reduce((acc, s) => acc + s.hours, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Archived Projects</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {archived.length === 0 ? (
            <p className="text-muted-foreground">No archived projects.</p>
          ) : (
            archived.map((p) => (
              <Link key={p.id} href={`/project/${p.id}`} className="block">
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="font-headline">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {formatHours(getProjectTotalHours(p.id), hourFormat, true)} total
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
