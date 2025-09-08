"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Clock, Edit } from 'lucide-react';
import { ActiveShift } from '@/lib/types';
import { differenceInSeconds, format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAppData } from '@/contexts/AppDataContext';
import { useSettings } from '@/contexts/SettingsContext';
import { formatTime } from '@/lib/utils';

interface ActiveShiftCardProps {
    activeShift: ActiveShift;
    onStop: () => void;
}

export function ActiveShiftCard({ activeShift, onStop }: ActiveShiftCardProps) {
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [editOpen, setEditOpen] = useState(false);
    const [datePart, setDatePart] = useState('');
    const [timePart, setTimePart] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { shifts } = useAppData();
    const { timeFormat } = useSettings();

    useEffect(() => {
        const calculateElapsedTime = () => {
            const now = new Date();
            const start = new Date(activeShift.startTime);
            const seconds = differenceInSeconds(now, start);
    
            if (seconds < 0) return '00:00:00';
    
            const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
    
            return `${h}:${m}:${s}`;
        }
        
        setElapsedTime(calculateElapsedTime());

        const timer = setInterval(() => {
            setElapsedTime(calculateElapsedTime());
        }, 1000);

                return () => clearInterval(timer);
        }, [activeShift]);

        useEffect(() => {
            // Initialize edit fields when dialog opens
            if (editOpen) {
                const start = new Date(activeShift.startTime);
                setDatePart(format(start, 'yyyy-MM-dd'));
                setTimePart(format(start, 'HH:mm'));
                setError(null);
            }
        }, [editOpen, activeShift.startTime]);

        const handleSave = () => {
            setError(null);
            // Basic validation structure
            const candidate = parseISO(`${datePart}T${timePart}:00`);
            if (isNaN(candidate.getTime())) {
                setError('Invalid date/time');
                return;
            }
            if (candidate > new Date()) {
                setError('Start time must be in the past');
                return;
            }
            // Overlap detection: candidate to now compared against existing shifts for that date
            const candidateDateKey = format(candidate, 'yyyy-MM-dd');
            const candMinutes = candidate.getHours() * 60 + candidate.getMinutes();
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            const overlapping = shifts.some(s => {
                if (s.date !== candidateDateKey) return false;
            const startPartsRaw = s.startTime.split(':');
            const endPartsRaw = s.endTime.split(':');
            if (startPartsRaw.length < 2 || endPartsRaw.length < 2) return false;
            const startHour = Number(startPartsRaw[0]);
            const startMinute = Number(startPartsRaw[1]);
            const endHour = Number(endPartsRaw[0]);
            const endMinute = Number(endPartsRaw[1]);
            if (Number.isNaN(startHour) || Number.isNaN(startMinute) || Number.isNaN(endHour) || Number.isNaN(endMinute)) return false;
            const startMin = startHour * 60 + startMinute;
            const endMin = endHour * 60 + endMinute;
                // Active shift interval: [candMinutes, nowMinutes)
                // Existing shift interval: [startMin, endMin)
                return Math.max(candMinutes, startMin) < Math.min(nowMinutes, endMin);
            });
            if (overlapping) {
                setError('New start overlaps an existing shift');
                return;
            }
            // Persist using context updater via custom event (avoid circular import). We'll dispatch a global event consumed externally.
            const customEvent = new CustomEvent('update-active-shift-start', { detail: { id: activeShift.id, iso: candidate.toISOString() }});
            window.dispatchEvent(customEvent);
            setEditOpen(false);
        };

        return (
        <Card className="bg-primary/10 border-primary/50">
            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center justify-between gap-2 text-primary">
                                    <div className="flex items-center gap-2">
                                        <Play className="h-5 w-5 animate-pulse" /> Active Shift
                                    </div>
                                    <Button variant="destructive" size="sm" onClick={onStop}>
                                        <Clock className="mr-2 h-4 w-4" /> Stop
                                    </Button>
                                </CardTitle>
            </CardHeader>
            <CardContent>
                                <div className="text-3xl font-bold text-foreground">{elapsedTime}</div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-4">Start Time</p>
                <p className="text-sm text-muted-foreground flex items-center flex-wrap gap-2 mt-1">
                                    <span>{format(new Date(activeShift.startTime), timeFormat === '12h' ? 'h:mm a' : 'HH:mm')}</span>
                                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Edit start time"
                                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-sm">
                                            <DialogHeader>
                                                <DialogTitle>Edit Start Time</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="flex flex-col space-y-2">
                                                    <label className="text-sm font-medium">Date</label>
                                                    <Input type="date" value={datePart} onChange={e => setDatePart(e.target.value)} max={format(new Date(), 'yyyy-MM-dd')} />
                                                </div>
                                                <div className="flex flex-col space-y-2">
                                                    <label className="text-sm font-medium">Time</label>
                                                    <Input type="time" value={timePart} onChange={e => setTimePart(e.target.value)} />
                                                </div>
                                                {error && <p className="text-sm text-destructive">{error}</p>}
                                            </div>
                                            <DialogFooter className="mt-4">
                                                <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
                                                <Button onClick={handleSave}>Save</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </p>
            </CardContent>
        </Card>
    );
}
