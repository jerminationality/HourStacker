"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Calendar } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { format, parseISO } from "date-fns";
import type { Shift, Period } from "@/lib/types";
import { minutesFromTime } from "@/lib/utils";

export default function ProjectPeriodsPage() {
  const params = useParams();
  const projectIdRaw = (params as Record<string, string | string[]>)['id'];
  const projectId = typeof projectIdRaw === 'string' ? projectIdRaw : '';
  const { getProjectById, shifts: allShifts, periods } = useAppData();
  const project = getProjectById(projectId);

  const projectPeriods: Period[] = useMemo(() => {
    const filtered = periods.filter(p => p.projectId === projectId);
    return filtered.sort((a, b) => {
      const aDates = allShifts.filter(s => s.projectId === projectId && s.periodId === a.id).map(s => s.date).filter(Boolean).sort();
      const bDates = allShifts.filter(s => s.projectId === projectId && s.periodId === b.id).map(s => s.date).filter(Boolean).sort();
      const aKey = aDates[0] || a.createdAt;
      const bKey = bDates[0] || b.createdAt;
      return new Date(aKey).getTime() - new Date(bKey).getTime();
    });
  }, [periods, projectId, allShifts]);

  const renderShiftGroups = (dayGroups: readonly (readonly [string, Shift[]])[]) => (
    dayGroups.map(([day, shifts]) => (
      <Card key={day}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" /> {format(parseISO(day), "MM/dd/yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* reuse existing renderer would be ideal; inline here for brevity */}
          <ul className="space-y-4">
            {shifts.map((s) => (
              <li key={s.id}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-foreground">
                    {s.hours.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {s.startTime} - {s.endTime}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    ))
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 sm:p-6 border-b border-border/50 bg-card/50 sticky top-0 backdrop-blur-sm z-10">
        <div className="max-w-[512px] w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
              <Link href={`/project/${projectId}`}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground font-headline">{project?.name ?? 'Project'}</h1>
              <p className="text-sm text-muted-foreground">Past Periods</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[512px] mx-auto px-4 sm:px-6 pt-2 sm:pt-3 pb-24">
        {projectPeriods.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past periods yet.</p>
        ) : (
          <div className="-mx-4 sm:-mx-6">
            <Accordion type="multiple" className="w-full space-y-0 divide-y divide-border border-y border-border">
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
                    <AccordionTrigger className="px-4 sm:px-6 py-2 text-base font-semibold hover:no-underline">
                      <div className="w-full flex items-center justify-between">
                        <span className="truncate pr-2">{dateLabel}</span>
                        <span className="text-sm text-muted-foreground flex items-baseline gap-1">
                          <span className="text-foreground font-medium">{hours.toFixed(2)}</span>
                          <span>Total Hours</span>
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="!pt-0 px-4 sm:px-6 pb-4">
                      {dayGroups.length > 0 ? (
                        <div className="space-y-4">
                          {renderShiftGroups(dayGroups)}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No shifts recorded in this period.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}
      </main>
    </div>
  );
}
