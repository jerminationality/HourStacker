
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, differenceInMinutes, parseISO } from "date-fns";

import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn, isOvernight } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState, useMemo } from "react";
import { useIsMounted } from '@/hooks/useIsMounted';
import type { Shift, ActiveShift } from "@/lib/types";
import { buildDateRange, buildDateRangeFromShift, shiftsOverlap } from '@/domain/shiftTime';
// removed settings import used only for preview

const createFormSchema = (otherShifts: Shift[], projectId: string, activeShift: ActiveShift | null, editingShift?: Shift | null) => {
    return z.object({
        date: z.date({ required_error: "A date is required." }),
        startTime: z.string().min(1, "Start time is required."),
        endTime: z.string().min(1, "End time is required."),
        description: z.string().optional(),
    })
    // Allow overnight (end earlier than start) but disallow identical times
    .refine(data => {
      if (data.startTime && data.endTime) {
        return data.startTime !== data.endTime;
      }
      return true;
    }, {
      message: "Start and end times must be different.",
      path: ["endTime"],
    })
    .superRefine((data, ctx) => {
    let range;
    try {
      range = buildDateRange(new Date(data.date), data.startTime, data.endTime);
    } catch (e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid time values.', path: ['startTime'] });
      return;
    }
    const { start: newStart, end: newEnd } = range;

    // If editing and unchanged times (and same date) skip further overlap checks
    if (editingShift && editingShift.date === format(data.date, 'yyyy-MM-dd') && editingShift.startTime === data.startTime && editingShift.endTime === data.endTime) {
      return;
    }

  const now = new Date();
  if (newEnd > now) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End time cannot be in the future.', path: ['endTime'] });
      return;
    }

    // Active shift overlap
    if (activeShift && activeShift.projectId === projectId) {
      const activeStart = new Date(activeShift.startTime);
      const activeEnd = new Date();
      if (shiftsOverlap(newStart, newEnd, activeStart, activeEnd, true)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This time overlaps with the currently active shift.', path: ['startTime'] });
        return;
      }
    }

    for (const shift of otherShifts) {
      const { start: existStart, end: existEnd } = buildDateRangeFromShift(shift);
      if (shiftsOverlap(newStart, newEnd, existStart, existEnd, true)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `This time overlaps with an existing shift (${shift.startTime} - ${shift.endTime})`,
          path: ['startTime'],
        });
        return;
      }
    }
  });
};

interface NewShiftDialogProps {
    children: ReactNode;
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shiftToEdit?: Shift | null;
    allShifts: Shift[];
    activeShift: ActiveShift | null;
}

export function NewShiftDialog({ children, projectId, open, onOpenChange, shiftToEdit, allShifts, activeShift }: NewShiftDialogProps) {
  const { addShift, updateShift } = useAppData();
  const isEditMode = !!shiftToEdit;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const otherShifts = useMemo(
    () => allShifts.filter(s => s.projectId === projectId && s.id !== (shiftToEdit?.id || '')),
    [allShifts, projectId, shiftToEdit?.id]
  );
  const formSchema = useMemo(() => createFormSchema(otherShifts, projectId, activeShift, shiftToEdit), [otherShifts, projectId, activeShift, shiftToEdit]);

  // Stable "today" captured once per component instance (server & client match) using date-only string
  const todayYMD = useMemo(() => {
    const now = new Date();
    // Use UTC normalization to avoid timezone shifting the date textual representation
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

  const isMounted = useIsMounted();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: todayYMD,
      startTime: "",
      endTime: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isEditMode && shiftToEdit) {
      form.reset({
        date: parseISO(shiftToEdit.date),
        startTime: shiftToEdit.startTime,
        endTime: shiftToEdit.endTime,
        description: shiftToEdit.description || "",
      });
    } else {
      form.reset({
        date: todayYMD,
        startTime: "",
        endTime: "",
        description: "",
      });
    }
  }, [shiftToEdit, open, form, isEditMode]);


  // Preview removed per request
  // Minimal overnight indicator in-dialog
  const startTimeValue = form.watch('startTime');
  const endTimeValue = form.watch('endTime');
  const showOvernightBadge = Boolean(startTimeValue && endTimeValue && isOvernight(startTimeValue!, endTimeValue!));

  function onSubmit(values: z.infer<typeof formSchema>) {
  const { start: startDateTime, end: endDateTime } = buildDateRange(new Date(values.date!), values.startTime!, values.endTime!);

    const totalMinutes = differenceInMinutes(endDateTime, startDateTime);
    const totalHours = totalMinutes / 60;
    
    if (isEditMode && shiftToEdit) {
      const updated: Shift = {
        ...shiftToEdit,
        projectId, // unchanged but explicit
        hours: totalHours,
        date: format(values.date!, 'yyyy-MM-dd'),
        startTime: values.startTime!,
        endTime: values.endTime!,
        description: values.description || null,
      };
      updateShift(updated);
    } else {
      // Do NOT include an id here so addShift assigns a fresh UUID
      addShift({
        projectId,
        hours: totalHours,
        date: format(values.date!, 'yyyy-MM-dd'),
        startTime: values.startTime!,
        endTime: values.endTime!,
        description: values.description || null,
      });
    }
    
  form.reset({ description: "", startTime: "", endTime: "", date: todayYMD });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Shift" : "Add New Shift"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4 pt-4">
                    <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {/* Defer potentially locale/timezone sensitive formatting until after mount to prevent hydration mismatch */}
                                            {field.value && isMounted ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={(date) => {
                                          field.onChange(date);
                                          setIsCalendarOpen(false);
                                      }}
                                      disabled={(date) => {
                                        // Compare against captured today if not mounted (server & first client render consistent)
                                        const nowRef = isMounted ? new Date() : todayYMD;
                                        return date > nowRef || date < new Date("1900-01-01");
                                      }}
                                      initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="startTime" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="endTime" render={({ field }) => (
                            <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    {/* Minimal overnight badge (no full preview) */}
                    {showOvernightBadge && (
                      <div className="pt-1">
                        <span className="inline-flex items-center rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[11px] font-medium tracking-wide">
                          Overnight (+1 day)
                        </span>
                      </div>
                    )}
                </div>
             <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="e.g., Worked on feature X, attended meeting." {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <DialogFooter>
                <Button type="submit">{isEditMode ? "Save Changes" : "Add Shift"}</Button>
            </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
