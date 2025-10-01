
"use client";

import { useTheme } from "next-themes";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ReactNode } from "react";
import { Separator } from "./ui/separator";

interface SettingsDialogProps {
    children: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ children, open, onOpenChange }: SettingsDialogProps) {
    const { theme, setTheme } = useTheme();
    const { timeFormat, setTimeFormat, hourFormat, setHourFormat, confirmDeleteShift, setConfirmDeleteShift, showTotalProjectHoursOnCards, setShowTotalProjectHoursOnCards, roundTotalsToQuarterHours, setRoundTotalsToQuarterHours } = useSettings();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] pb-1">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Customize the look and feel of the app.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 pt-4 pb-1">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                        <Switch
                            id="dark-mode"
                            checked={theme === "dark"}
                            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                        />
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <Label className="text-base">Time Format</Label>
                        <RadioGroup value={timeFormat} onValueChange={(value) => setTimeFormat(value as '12h' | '24h')}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="12h" id="12h" />
                                <Label htmlFor="12h">12-hour (AM/PM)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="24h" id="24h" />
                                <Label htmlFor="24h">24-hour</Label>
                            </div>
                        </RadioGroup>
                    </div>
                     <Separator />
                    <div className="space-y-3">
                        <Label className="text-base">Hour Display</Label>
                        <RadioGroup value={hourFormat} onValueChange={(value) => setHourFormat(value as 'decimal' | 'hhmm' | 'both')}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="decimal" id="decimal" />
                                <Label htmlFor="decimal">Decimal (e.g., 1.5)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="hhmm" id="hhmm" />
                                <Label htmlFor="hhmm">HH:MM (e.g., 01:30)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="both" id="both" />
                                <Label htmlFor="both">Both (e.g., 1.50 (01:30))</Label>
                            </div>
                        </RadioGroup>
                    </div>
                     <Separator />
                    {/* Rounding first among boolean toggles */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="round-quarter" className="text-base">Round totals up to next 1/4 hour</Label>
                            <p className="text-sm text-muted-foreground">Always rounds up. Applies to totals and exports; individual shift entries remain exact.</p>
                        </div>
                        <Switch
                            id="round-quarter"
                            checked={roundTotalsToQuarterHours}
                            onCheckedChange={setRoundTotalsToQuarterHours}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="confirm-delete" className="text-base">Confirm Shift Deletion</Label>
                            <p className="text-sm text-muted-foreground">Show a confirmation dialog before deleting a single shift.</p>
                        </div>
                        <Switch
                            id="confirm-delete"
                            checked={confirmDeleteShift}
                            onCheckedChange={setConfirmDeleteShift}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="show-total-proj-hours" className="text-base">Display total project hours on project cards</Label>
                            <p className="text-sm text-muted-foreground">Show consolidated + current hours side by side.</p>
                        </div>
                        <Switch
                            id="show-total-proj-hours"
                            checked={showTotalProjectHoursOnCards}
                            onCheckedChange={setShowTotalProjectHoursOnCards}
                        />
                    </div>
                    {/* Version label */}
                    <div className="flex justify-end">
                        <span className="text-xs text-muted-foreground">Build version 0.9</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
