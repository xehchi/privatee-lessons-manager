import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DAY_KEYS, DAY_NAMES, DayKey, LESSON_DURATION, Lesson, LessonType } from "@/lib/types";
import { useAppData } from "@/lib/useAppData";
import { canPlaceLesson, lessonEnd, toMin, toTime } from "@/lib/schedule";
import { Button } from "@/components/ui/button";
import { LessonDialog } from "./LessonDialog";
import { Plus, CalendarDays, CalendarRange, Phone, Hash, GraduationCap, GripVertical, Printer, Sparkles } from "lucide-react";
import { toast } from "sonner";

type ViewMode = "week" | "day";

const SLOT_MINUTES = 15;
const SLOT_HEIGHT = 14;

export function ScheduleView() {
  const { data, hydrated, updateLesson } = useAppData();
  const [view, setView] = useState<ViewMode>("week");
  const [selectedDay, setSelectedDay] = useState<DayKey>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [defaultDay, setDefaultDay] = useState<DayKey>(0);
  const [defaultStart, setDefaultStart] = useState<string | undefined>();
  const [defaultType, setDefaultType] = useState<LessonType | undefined>();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<string | null>(null);
  const [freeMode, setFreeMode] = useState<"off" | "single" | "double">("off");

  const { startMin, endMin } = useMemo(() => {
    let s = 24 * 60, e = 0;
    for (const d of DAY_KEYS) {
      for (const r of data.workHours[d]) {
        s = Math.min(s, toMin(r.start));
        e = Math.max(e, toMin(r.end));
      }
    }
    if (s >= e) { s = 8 * 60; e = 17 * 60; }
    s = Math.floor(s / 60) * 60;
    e = Math.ceil(e / 60) * 60;
    return { startMin: s, endMin: e };
  }, [data.workHours]);

  const totalSlots = (endMin - startMin) / SLOT_MINUTES;
  const hourCount = (endMin - startMin) / 60;

  const openCreate = (day: DayKey, start?: string, type?: LessonType) => {
    setEditing(null);
    setDefaultDay(day);
    setDefaultStart(start);
    setDefaultType(type);
    setDialogOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditing(lesson);
    setDialogOpen(true);
  };

  const onDropLesson = useCallback((e: React.DragEvent, day: DayKey, slotMin: number) => {
    e.preventDefault();
    setHoverCell(null);
    setDraggingId(null);
    const id = e.dataTransfer.getData("lesson-id");
    if (!id) return;
    const lesson = data.lessons.find((l) => l.id === id);
    if (!lesson) return;
    const newStart = toTime(slotMin);
    if (lesson.day === day && lesson.start === newStart) return;
    const check = canPlaceLesson(data.workHours[day], data.lessons, day, newStart, lesson.type, lesson.id);
    if (!check.ok) {
      toast.error(check.reason);
      return;
    }
    updateLesson({ ...lesson, day, start: newStart });
    toast.success("השיעור הועבר");
  }, [data, updateLesson]);

  const handlePrint = () => window.print();

  const renderDayColumn = (day: DayKey) => {
    const ranges = data.workHours[day];
    const dayLessons = data.lessons.filter((l) => l.day === day).sort((a, b) => toMin(a.start) - toMin(b.start));

    // Compute free slots when free-mode is active
    const freeBlocks: { start: number; end: number }[] = [];
    if (freeMode !== "off") {
      const dur = LESSON_DURATION[freeMode];
      for (let m = startMin; m + dur <= endMin; m += SLOT_MINUTES) {
        const time = toTime(m);
        if (canPlaceLesson(ranges, data.lessons, day, time, freeMode).ok) {
          freeBlocks.push({ start: m, end: m + dur });
        }
      }
    }

    return (
      <div className="relative" style={{ height: totalSlots * SLOT_HEIGHT }}>
        {/* Work-hour band backgrounds (visually contained) */}
        {ranges.map((r, idx) => {
          const top = (toMin(r.start) - startMin) / SLOT_MINUTES * SLOT_HEIGHT;
          const height = (toMin(r.end) - toMin(r.start)) / SLOT_MINUTES * SLOT_HEIGHT;
          return (
            <div
              key={`work-${idx}`}
              className="work-band pointer-events-none absolute inset-x-1 rounded-md border border-primary/30 bg-primary/[0.04]"
              style={{ top, height, boxShadow: "inset 0 0 0 1px oklch(0.72 0.14 195 / 0.08)" }}
            >
              <div className="absolute inset-x-0 top-0 flex items-center justify-between px-1.5 py-0.5 text-[9px] font-medium text-primary/80 tabular-nums">
                <span>{r.start}</span>
                <span>{r.end}</span>
              </div>
            </div>
          );
        })}

        {/* Click/drop slot grid */}
        {Array.from({ length: totalSlots }).map((_, i) => {
          const m = startMin + i * SLOT_MINUTES;
          const inWork = ranges.some((r) => toMin(r.start) <= m && toMin(r.end) > m);
          const isHourLine = m % 60 === 0;
          const cellKey = `${day}-${m}`;
          const isHover = hoverCell === cellKey && draggingId !== null && inWork;
          return (
            <div
              key={i}
              onClick={() => inWork && openCreate(day, toTime(m))}
              onDragOver={(e) => {
                if (!inWork) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (hoverCell !== cellKey) setHoverCell(cellKey);
              }}
              onDragLeave={() => { if (hoverCell === cellKey) setHoverCell(null); }}
              onDrop={(e) => inWork && onDropLesson(e, day, m)}
              className={`absolute inset-x-0 transition-colors ${
                inWork
                  ? `cursor-pointer work-slot ${isHover ? "drop-target-active" : "hover:bg-primary/10"}`
                  : "nonwork-slot bg-background/60"
              } ${isHourLine ? "border-t border-border/40" : "border-t border-border/10"}`}
              style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
            />
          );
        })}

        {/* Free-slot overlays */}
        {freeMode !== "off" && freeBlocks.map((b, idx) => {
          const top = (b.start - startMin) / SLOT_MINUTES * SLOT_HEIGHT;
          const height = (b.end - b.start) / SLOT_MINUTES * SLOT_HEIGHT;
          return (
            <button
              key={`free-${idx}`}
              type="button"
              onClick={(e) => { e.stopPropagation(); openCreate(day, toTime(b.start), freeMode); }}
              className="free-slot group/free absolute inset-x-1 cursor-pointer rounded-md border-2 border-dashed border-success/60 bg-success/10 text-success transition-all hover:bg-success/20 hover:scale-[1.01]"
              style={{ top: top + 1, height: height - 2 }}
              title={`פנוי לשיעור ${freeMode === "double" ? "כפול" : "רגיל"} ${toTime(b.start)}–${toTime(b.end)}`}
            >
              <div className="flex h-full items-center justify-center gap-1 text-[10px] font-semibold tabular-nums">
                <Plus className="h-3 w-3 opacity-0 transition-opacity group-hover/free:opacity-100" />
                {toTime(b.start)}
              </div>
            </button>
          );
        })}

        {/* Lessons (mounted only after hydration to avoid SSR mismatch) */}
        {hydrated && (
          <AnimatePresence initial={false}>
            {dayLessons.map((l) => {
              const top = (toMin(l.start) - startMin) / SLOT_MINUTES * SLOT_HEIGHT;
              const height = LESSON_DURATION[l.type] / SLOT_MINUTES * SLOT_HEIGHT;
              const isDouble = l.type === "double";
              return (
                <motion.div
                  key={l.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.6 }}
                  draggable
                  onDragStartCapture={(e) => {
                    e.dataTransfer.setData("lesson-id", l.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingId(l.id);
                  }}
                  onDragEnd={() => { setDraggingId(null); setHoverCell(null); }}
                  onClick={(e) => { e.stopPropagation(); openEdit(l); }}
                  className={`group lesson-block ${isDouble ? "lesson-double" : ""} absolute inset-x-1 cursor-grab active:cursor-grabbing overflow-hidden rounded-lg border p-2 text-xs shadow-elegant hover:shadow-glow ${
                    draggingId === l.id ? "dragging-lesson" : ""
                  } ${
                    isDouble
                      ? "border-accent/60 bg-accent/20 text-accent-foreground"
                      : "border-primary/50 bg-primary/20 text-foreground"
                  }`}
                  style={{ top: top + 1, height: height - 2, willChange: "transform" }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold leading-tight">{l.studentName}</div>
                      <div className={`mt-0.5 text-[10px] tabular-nums ${isDouble ? "text-accent" : "text-primary"}`}>
                        {l.start} – {lessonEnd(l)}
                      </div>
                      {(l.classRoom || l.phone || l.cardNumber) && height > 50 && (
                        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                          {l.classRoom && <span className="flex items-center gap-0.5"><GraduationCap className="h-2.5 w-2.5" />{l.classRoom}</span>}
                          {l.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{l.phone}</span>}
                          {l.cardNumber && <span className="flex items-center gap-0.5"><Hash className="h-2.5 w-2.5" />{l.cardNumber}</span>}
                        </div>
                      )}
                    </div>
                    <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 no-print" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    );
  };

  const daysToShow: DayKey[] = view === "week" ? DAY_KEYS : [selectedDay];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">לוח זמנים</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            לחצי על משבצת פנויה כדי להוסיף שיעור · גררי שיעורים כדי להזיז אותם
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setView("week")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                view === "week" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" /> שבועי
            </button>
            <button
              onClick={() => setView("day")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                view === "day" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" /> יומי
            </button>
          </div>

          {/* Free slots toggle */}
          <div className="flex rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setFreeMode("off")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                freeMode === "off" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              title="כבוי"
            >
              <Sparkles className="inline h-3.5 w-3.5 opacity-60" />
            </button>
            <button
              onClick={() => setFreeMode("single")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                freeMode === "single" ? "bg-success text-success-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              פנוי 45ד׳
            </button>
            <button
              onClick={() => setFreeMode("double")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                freeMode === "double" ? "bg-success text-success-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              פנוי 90ד׳
            </button>
          </div>

          {view === "day" && (
            <div className="flex rounded-xl border border-border bg-card p-1">
              {DAY_KEYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    selectedDay === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {DAY_NAMES[d]}
                </button>
              ))}
            </div>
          )}
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1.5">
            <Printer className="h-4 w-4" /> הדפסה / PDF
          </Button>
          <Button onClick={() => openCreate(selectedDay)} className="gap-1.5 gradient-primary text-primary-foreground shadow-glow">
            <Plus className="h-4 w-4" /> שיעור חדש
          </Button>
        </div>
      </div>

      {/* Print-only title */}
      <div className="print-only mb-3">
        <h2 style={{ fontSize: "18pt", fontWeight: 700, margin: 0 }}>
          {view === "week" ? "לוח זמנים שבועי" : `לוח זמנים יומי – יום ${DAY_NAMES[selectedDay]}`}
        </h2>
      </div>

      <div className="print-area overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
        <div className="grid" style={{ gridTemplateColumns: `60px repeat(${daysToShow.length}, minmax(0, 1fr))` }}>
          <div className="border-b border-border bg-muted/30 day-header" />
          {daysToShow.map((d) => {
            const count = data.lessons.filter((l) => l.day === d).length;
            return (
              <div key={d} className="day-header border-b border-l border-border bg-muted/30 px-3 py-3 text-center last:border-l-0">
                <div className="text-sm font-bold">{DAY_NAMES[d]}</div>
                <div className="text-[10px] text-muted-foreground">
                  {hydrated ? (count > 0 ? `${count} שיעורים` : "אין שיעורים") : "\u00a0"}
                </div>
              </div>
            );
          })}

          <div className="relative border-l border-border bg-muted/10" style={{ height: totalSlots * SLOT_HEIGHT }}>
            {Array.from({ length: hourCount + 1 }).map((_, i) => {
              const m = startMin + i * 60;
              return (
                <div
                  key={i}
                  className="absolute inset-x-0 -translate-y-1/2 text-center text-[10px] font-medium tabular-nums text-muted-foreground"
                  style={{ top: i * 60 / SLOT_MINUTES * SLOT_HEIGHT }}
                >
                  {toTime(m)}
                </div>
              );
            })}
          </div>

          {daysToShow.map((d) => (
            <div key={d} className="border-l border-border last:border-l-0">
              {renderDayColumn(d)}
            </div>
          ))}
        </div>
      </div>

      {freeMode !== "off" && (
        <div className="no-print rounded-xl border border-success/30 bg-success/5 px-4 py-2 text-xs text-success">
          מצב "שעות פנויות" פעיל · מציג חלוניות אפשריות לשיעור {freeMode === "double" ? "כפול (90 ד׳)" : "רגיל (45 ד׳)"}. לחצי על חלונית כדי לקבוע שיעור.
        </div>
      )}

      <LessonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDay={defaultDay}
        defaultStart={defaultStart}
        defaultType={defaultType}
        editing={editing}
      />
    </div>
  );
}
