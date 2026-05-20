import { useState } from "react";
import { DAY_KEYS, DAY_NAMES, DayKey, WorkHours, WorkRange } from "@/lib/types";
import { useAppData } from "@/lib/useAppData";
import { toMin } from "@/lib/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Clock } from "lucide-react";
import { toast } from "sonner";

export function WorkHoursEditor() {
  const { data, setWorkHours } = useAppData();
  const [draft, setDraft] = useState<WorkHours>(data.workHours);

  const updateRange = (day: DayKey, idx: number, field: "start" | "end", value: string) => {
    setDraft({
      ...draft,
      [day]: draft[day].map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    });
  };

  const addRange = (day: DayKey) => {
    const newRange: WorkRange = { id: crypto.randomUUID(), start: "09:00", end: "13:00" };
    setDraft({ ...draft, [day]: [...draft[day], newRange] });
  };

  const removeRange = (day: DayKey, idx: number) => {
    setDraft({ ...draft, [day]: draft[day].filter((_, i) => i !== idx) });
  };

  const save = () => {
    // Validate
    for (const d of DAY_KEYS) {
      for (const r of draft[d]) {
        if (toMin(r.end) <= toMin(r.start)) {
          toast.error(`יום ${DAY_NAMES[d]}: שעת סיום חייבת להיות אחרי שעת התחלה`);
          return;
        }
      }
    }
    setWorkHours(draft);
    toast.success("זמני העבודה נשמרו");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">זמני עבודה</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            הגדירי טווחי שעות עבודה לכל יום בשבוע. שיעורים ניתן יהיה לשבץ רק בתוך טווחים אלו.
          </p>
        </div>
        <Button onClick={save} className="gap-2 gradient-primary text-primary-foreground shadow-glow">
          <Save className="h-4 w-4" />
          שמור שינויים
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DAY_KEYS.map((day) => (
          <div
            key={day}
            className="rounded-2xl border border-border bg-card p-5 shadow-elegant transition-all hover:border-primary/40"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="font-semibold">יום {DAY_NAMES[day]}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addRange(day)}
                className="h-7 px-2 text-primary hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {draft[day].length === 0 ? (
              <p className="rounded-lg bg-muted/40 px-3 py-4 text-center text-xs text-muted-foreground">
                אין שעות עבודה ביום זה
              </p>
            ) : (
              <div className="space-y-2">
                {draft[day].map((r, idx) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 rounded-lg bg-muted/40 p-2"
                  >
                    <Input
                      type="time"
                      value={r.start}
                      onChange={(e) => updateRange(day, idx, "start", e.target.value)}
                      className="h-9 flex-1 bg-background"
                    />
                    <span className="text-xs text-muted-foreground">עד</span>
                    <Input
                      type="time"
                      value={r.end}
                      onChange={(e) => updateRange(day, idx, "end", e.target.value)}
                      className="h-9 flex-1 bg-background"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRange(day, idx)}
                      className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
