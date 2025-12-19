
"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useSettings } from "@/contexts/SettingsContext";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettingsDialogProps {
    children: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStartTutorial?: () => void;
}

export function SettingsDialog({ children, open, onOpenChange, onStartTutorial }: SettingsDialogProps) {
    const { theme, setTheme } = useTheme();
    const { timeFormat, setTimeFormat, hourFormat, setHourFormat, confirmDeleteShift, setConfirmDeleteShift, showTotalProjectHoursOnCards, setShowTotalProjectHoursOnCards, roundTotalsToQuarterHours, setRoundTotalsToQuarterHours } = useSettings();
    const handleTutorialClick = () => {
        onStartTutorial?.();
    };

    // Handle browser back button to close dialog
    useEffect(() => {
        if (open) {
            window.history.pushState({ settingsDialog: true }, '');
            const handlePopState = () => {
                if (open) {
                    onOpenChange(false);
                }
            };
            window.addEventListener('popstate', handlePopState);
            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [open, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
                <DialogHeader className="pb-2 sm:pb-3">
                    <DialogTitle className="text-base sm:text-lg">Settings</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Customize the look and feel of the app.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 sm:gap-4 pt-2 pb-1">
                    <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="dark-mode" className="text-sm sm:text-base">Dark Mode</Label>
                        <Switch
                            id="dark-mode"
                            checked={theme === "dark"}
                            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                        />
                    </div>
                    <Separator className="my-1" />
                    <div className="space-y-2">
                        <Label className="text-sm sm:text-base">Time Format</Label>
                        <RadioGroup value={timeFormat} onValueChange={(value) => setTimeFormat(value as '12h' | '24h')}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="12h" id="12h" />
                                <Label htmlFor="12h" className="text-sm">12-hour (AM/PM)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="24h" id="24h" />
                                <Label htmlFor="24h" className="text-sm">24-hour</Label>
                            </div>
                        </RadioGroup>
                    </div>
                     <Separator className="my-1" />
                    <div className="space-y-2">
                        <Label className="text-sm sm:text-base">Hour Display</Label>
                        <RadioGroup value={hourFormat} onValueChange={(value) => setHourFormat(value as 'decimal' | 'hhmm' | 'both')}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="decimal" id="decimal" />
                                <Label htmlFor="decimal" className="text-sm">Decimal (e.g., 1.5)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="hhmm" id="hhmm" />
                                <Label htmlFor="hhmm" className="text-sm">HH:MM (e.g., 01:30)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="both" id="both" />
                                <Label htmlFor="both" className="text-sm">Both (e.g., 1.50 (01:30))</Label>
                            </div>
                        </RadioGroup>
                    </div>
                     <Separator className="my-1" />
                    {/* Rounding first among boolean toggles */}
                    <div className="flex items-center justify-between gap-2 mb-1 sm:mb-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="round-quarter" className="text-sm sm:text-base leading-tight">Round totals up to next 1/4 hour</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-tight">Applies to totals and exports; individual shift entries remain exact.</p>
                        </div>
                        <Switch
                            id="round-quarter"
                            checked={roundTotalsToQuarterHours}
                            onCheckedChange={setRoundTotalsToQuarterHours}
                            className="flex-shrink-0"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-1 sm:mb-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="confirm-delete" className="text-sm sm:text-base leading-tight">Confirm Shift Deletion</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-tight">Show a confirmation dialog before deleting a single shift.</p>
                        </div>
                        <Switch
                            id="confirm-delete"
                            checked={confirmDeleteShift}
                            onCheckedChange={setConfirmDeleteShift}
                            className="flex-shrink-0"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-1 sm:mb-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="show-total-proj-hours" className="text-sm sm:text-base leading-tight">Display total project hours on project cards</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-tight">Show both current shift and entire project totals.</p>
                        </div>
                        <Switch
                            id="show-total-proj-hours"
                            checked={showTotalProjectHoursOnCards}
                            onCheckedChange={setShowTotalProjectHoursOnCards}
                            className="flex-shrink-0"
                        />
                    </div>
                    {/* Version label + tutorial shortcut */}
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleTutorialClick}
                            className="text-xs font-medium text-accent underline underline-offset-2 hover:text-accent/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/60"
                        >
                            Tutorial
                        </button>
                        <span className="text-xs text-muted-foreground">Build version 1.3</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
