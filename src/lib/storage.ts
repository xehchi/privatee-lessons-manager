import { AppData, DAY_KEYS, WorkHours } from "./types";

const KEY = "schedule-app-data-v1";

export function defaultAppData(): AppData {
  const workHours: WorkHours = DAY_KEYS.reduce((acc, d) => {
    acc[d] = d === 5 ? [] : [{ id: `default-${d}`, start: "09:00", end: "17:00" }];
    return acc;
  }, {} as WorkHours);
  return { workHours, lessons: [] };
}

export function loadLocal(): AppData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.workHours || !Array.isArray(parsed.lessons)) return null;
    return parsed as AppData;
  } catch {
    return null;
  }
}

export function saveLocal(data: AppData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

// Kept for backward compat with any other imports
export const loadData = (): AppData => loadLocal() ?? defaultAppData();
export const saveData = saveLocal;

export function exportJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importJSON(json: string): AppData {
  const parsed = JSON.parse(json);
  if (!parsed.workHours || !Array.isArray(parsed.lessons)) {
    throw new Error("קובץ לא תקין");
  }
  return parsed;
}
