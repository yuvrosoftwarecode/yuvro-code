export interface Topic {
  id: string;
  name: string;
  order_index?: number;
}

export interface Course {
  id: string;
  name: string;
  category: string;
  short_code?: string;
  topics?: Topic[];
}

export interface Stats {
  lessons_completed: number;
  time_spent: string;
  avg_progress: number;
}

export interface ContinueProgress {
  course: string;
  lesson: number;
  total_lessons: number;
  percent: number;
}

export interface CourseProgressMap {
  [courseId: string]: number; // percent
}