import { BREAK_MINUTES, DayKey, LESSON_DURATION, Lesson, LessonType, WorkRange } from "./types";

export const toMin = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const toTime = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const lessonEndMin = (l: Lesson): number =>
  toMin(l.start) + LESSON_DURATION[l.type];

export const lessonEnd = (l: Lesson): string => toTime(lessonEndMin(l));

/**
 * Returns true if a candidate lesson can fit:
 *  - lies fully within a work range on that day
 *  - leaves at least BREAK_MINUTES before/after every existing lesson on that day
 */
export function canPlaceLesson(
  ranges: WorkRange[],
  existing: Lesson[],
  day: DayKey,
  start: string,
  type: LessonType,
  ignoreId?: string
): { ok: true } | { ok: false; reason: string } {
  const startM = toMin(start);
  const endM = startM + LESSON_DURATION[type];

  // Within work range?
  const inRange = ranges.some((r) => toMin(r.start) <= startM && toMin(r.end) >= endM);
  if (!inRange) return { ok: false, reason: "השיעור חורג מזמני העבודה" };

  // Conflicts with another lesson + 15 min break
  for (const l of existing) {
    if (l.day !== day || l.id === ignoreId) continue;
    const lStart = toMin(l.start);
    const lEnd = lessonEndMin(l);
    // overlap if [startM,endM) intersects [lStart - break, lEnd + break)
    const blockStart = lStart - BREAK_MINUTES;
    const blockEnd = lEnd + BREAK_MINUTES;
    if (startM < blockEnd && endM > blockStart) {
      return {
        ok: false,
        reason: `מתנגש עם שיעור של ${l.studentName} (${l.start}-${toTime(lEnd)})`,
      };
    }
  }

  return { ok: true };
}

/**
 * Suggests possible start times for a lesson on a given day.
 */
export function suggestStartTimes(
  ranges: WorkRange[],
  existing: Lesson[],
  day: DayKey,
  type: LessonType
): string[] {
  const out: string[] = [];
  const dur = LESSON_DURATION[type];
  for (const r of ranges) {
    const s = toMin(r.start);
    const e = toMin(r.end);
    for (let t = s; t + dur <= e; t += 15) {
      const time = toTime(t);
      if (canPlaceLesson(ranges, existing, day, time, type).ok) {
        out.push(time);
      }
    }
  }
  return out;
}
