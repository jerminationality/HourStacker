export interface Project {
  id: string;
  name: string;
}

export interface Shift {
  id: string;
  projectId: string;
  hours: number;
  date: string;
  startTime: string;
  endTime: string;
  description: string | null;
}

export interface ActiveShift {
    id: string;
    projectId: string;
    startTime: string;
}

    