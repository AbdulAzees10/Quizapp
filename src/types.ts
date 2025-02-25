export interface Quiz {
  id: string;
  title: string;
  subject: string;
  batch?: string;
  unit?: number;
  createdAt: string; // ISO date string
  sections: Section[];
  totalDuration: number;
  totalMarks: number;
  // ... other existing fields ...
} 