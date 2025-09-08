export interface Project {
  id: string;
  name: string;
  // ISO timestamp when the project was created; optional for legacy entries
  createdAt?: string;
  // Whether the project is archived (hidden from the default list)
  archived?: boolean;
}

export interface Shift {
  id: string;
  projectId: string;
  hours: number;
  date: string;
  startTime: string;
  endTime: string;
  description: string | null;
  // Optional period grouping; undefined means part of the current (active) period
  periodId?: string;
}

export interface Period {
  id: string;
  projectId: string;
  name: string;
  createdAt: string; // ISO timestamp
  // Derived metadata could be computed (e.g., totalHours, date range) rather than stored
}

export interface ActiveShift {
    id: string;
    projectId: string;
    startTime: string;
}

    