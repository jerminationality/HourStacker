"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Clock } from 'lucide-react';
import { ActiveShift } from '@/lib/types';
import { differenceInSeconds } from 'date-fns';

interface ActiveShiftCardProps {
    activeShift: ActiveShift;
    onStop: () => void;
}

export function ActiveShiftCard({ activeShift, onStop }: ActiveShiftCardProps) {
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

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
                <p className="text-sm text-muted-foreground">Elapsed Time</p>
            </CardContent>
        </Card>
    );
}
