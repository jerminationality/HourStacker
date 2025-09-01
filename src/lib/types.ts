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
}

export interface ActiveShift {
    id: string;
    projectId: string;
    startTime: string;
}

    