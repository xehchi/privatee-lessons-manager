export type DayKey = 0 | 1 | 2 | 3 | 4 | 5; // Sun..Fri (no Saturday=6)

export const DAY_NAMES: Record<DayKey, string> = {
  0: "ראשון",
  1: "שני",
  2: "שלישי",
  3: "רביעי",
  4: "חמישי",
  5: "שישי",
};

export const DAY_KEYS: DayKey[] = [0, 1, 2, 3, 4, 5];

export interface WorkRange {
  id: string;
  start: string; // "HH:mm"
  end: string;
}

export type WorkHours = Record<DayKey, WorkRange[]>;

export type LessonType = "single" | "double";

export const LESSON_DURATION: Record<LessonType, number> = {
  single: 45,
  double: 90,
};

export const BREAK_MINUTES = 15;

export interface Lesson {
  id: string;
  studentName: string;
  classRoom?: string;
  phone?: string;
  cardNumber?: string;
  day: DayKey;
  start: string; // "HH:mm"
  type: LessonType;
  notes?: string;
}

export interface AppData {
  workHours: WorkHours;
  lessons: Lesson[];
}
