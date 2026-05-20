import { useEffect, useState } from "react";
import { DAY_NAMES, DayKey, Lesson, LessonType } from "@/lib/types";
import { canPlaceLesson, suggestStartTimes, toMin } from "@/lib/schedule";
import { useAppData } from "@/lib/useAppData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDay?: DayKey;
  defaultStart?: string;
  defaultType?: LessonType;
  editing?: Lesson | null;
}

export function LessonDialog({ open, onOpenChange, defaultDay = 0, defaultStart, defaultType, editing }: Props) {
  const { data, addLesson, updateLesson, removeLesson } = useAppData();

  const [studentName, setStudentName] = useState("");
  const [classRoom, setClassRoom] = useState("");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [day, setDay] = useState<DayKey>(defaultDay);
  const [type, setType] = useState<LessonType>(defaultType ?? "single");
  const [start, setStart] = useState<string>(defaultStart ?? "");

  useEffect(() => {
    if (open) {
      if (editing) {
        setStudentName(editing.studentName);
        setClassRoom(editing.classRoom ?? "");
        setPhone(editing.phone ?? "");
        setCardNumber(editing.cardNumber ?? "");
        setNotes(editing.notes ?? "");
        setDay(editing.day);
        setType(editing.type);
        setStart(editing.start);
      } else {
        setStudentName("");
        setClassRoom("");
        setPhone("");
        setCardNumber("");
        setNotes("");
        setDay(defaultDay);
        setType(defaultType ?? "single");
        setStart(defaultStart ?? "");
      }
    }
  }, [open, editing, defaultDay, defaultStart, defaultType]);


  const ranges = data.workHours[day] ?? [];
  const suggestions = suggestStartTimes(ranges, data.lessons, day, type)
    .filter((t) => t !== editing?.start || true);

  // include current editing time so it remains selectable
  const allOptions = editing && editing.day === day && !suggestions.includes(editing.start)
    ? [editing.start, ...suggestions].sort((a, b) => toMin(a) - toMin(b))
    : suggestions;

  const handleSave = () => {
    if (!studentName.trim()) {
      toast.error("שם תלמידה הוא שדה חובה");
      return;
    }
    if (!start) {
      toast.error("יש לבחור שעת התחלה");
      return;
    }
    const check = canPlaceLesson(ranges, data.lessons, day, start, type, editing?.id);
    if (!check.ok) {
      toast.error(check.reason);
      return;
    }

    const lesson: Lesson = {
      id: editing?.id ?? crypto.randomUUID(),
      studentName: studentName.trim(),
      classRoom: classRoom.trim() || undefined,
      phone: phone.trim() || undefined,
      cardNumber: cardNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      day,
      type,
      start,
    };

    if (editing) {
      updateLesson(lesson);
      toast.success("השיעור עודכן");
    } else {
      addLesson(lesson);
      toast.success("השיעור נוסף");
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!editing) return;
    removeLesson(editing.id);
    toast.success("השיעור נמחק");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editing ? "עריכת שיעור" : "שיעור חדש"}</DialogTitle>
          <DialogDescription>
            מלאי את פרטי השיעור. רק שם התלמידה הוא שדה חובה.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>שם תלמידה *</Label>
            <Input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="שרה כהן"
              autoFocus
              maxLength={80}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>יום</Label>
              <Select value={String(day)} onValueChange={(v) => setDay(Number(v) as DayKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DAY_NAMES).map(([k, name]) => (
                    <SelectItem key={k} value={k}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>סוג שיעור</Label>
              <Select value={type} onValueChange={(v) => setType(v as LessonType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">רגיל (45 דק׳)</SelectItem>
                  <SelectItem value="double">כפול (90 דק׳)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>שעת התחלה</Label>
            {allOptions.length === 0 ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                אין משבצות זמן פנויות ביום זה. בדקי את זמני העבודה או שיעורים קיימים.
              </p>
            ) : (
              <Select value={start} onValueChange={setStart}>
                <SelectTrigger><SelectValue placeholder="בחרי שעה..." /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {allOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">כיתה</Label>
              <Input value={classRoom} onChange={(e) => setClassRoom(e.target.value)} maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">טלפון</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">כרטיסיה</Label>
              <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={20} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">הערות</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={300} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {editing && (
            <Button variant="ghost" onClick={handleDelete} className="ml-auto text-destructive hover:bg-destructive/10">
              <Trash2 className="ml-1 h-4 w-4" /> מחק
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
            {editing ? "עדכון" : "הוספה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
