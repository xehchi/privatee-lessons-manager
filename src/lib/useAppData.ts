import { useEffect, useState } from "react";
import { AppData, Lesson, WorkHours } from "@/lib/types";
import { defaultAppData, loadLocal, saveLocal } from "@/lib/storage";
import { loadFromDisk, saveToDisk } from "@/lib/storage.functions";

let memCache: AppData = defaultAppData();
let initialized = false;
const listeners = new Set<(d: AppData) => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function persist(data: AppData) {
  // Always write localStorage as fast cache
  saveLocal(data);
  // Debounced disk write via server function (no-op if fs unavailable)
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveToDisk({ data }).catch(() => {
      /* offline / no fs — localStorage is the source of truth */
    });
  }, 400);
}

function broadcast(data: AppData) {
  memCache = data;
  listeners.forEach((l) => l(data));
}

function set(data: AppData) {
  broadcast(data);
  void persist(data);
}

async function initOnce() {
  if (initialized) return;
  initialized = true;
  // 1. Try disk via server fn
  try {
    const res = await loadFromDisk();
    if (res.ok && res.data) {
      broadcast(res.data);
      saveLocal(res.data);
      return;
    }
  } catch {
    /* ignore */
  }
  // 2. Fallback to localStorage
  const local = loadLocal();
  if (local) broadcast(local);
}

export function useAppData() {
  // SSR-safe: always start from default so server and first client render match.
  const [data, setData] = useState<AppData>(memCache);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    const listener = (d: AppData) => {
      if (mounted) setData(d);
    };
    listeners.add(listener);

    void initOnce().finally(() => {
      if (mounted) {
        setData(memCache);
        setHydrated(true);
      }
    });

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return {
    data,
    hydrated,
    setWorkHours: (workHours: WorkHours) => set({ ...data, workHours }),
    addLesson: (lesson: Lesson) => set({ ...data, lessons: [...data.lessons, lesson] }),
    updateLesson: (lesson: Lesson) =>
      set({ ...data, lessons: data.lessons.map((l) => (l.id === lesson.id ? lesson : l)) }),
    removeLesson: (id: string) =>
      set({ ...data, lessons: data.lessons.filter((l) => l.id !== id) }),
    replaceAll: (d: AppData) => set(d),
  };
}
