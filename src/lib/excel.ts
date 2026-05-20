import * as XLSX from "xlsx";
import { AppData, DAY_NAMES, DayKey, LESSON_DURATION } from "./types";
import { lessonEnd } from "./schedule";

export function exportWeeklyExcel(data: AppData) {
  const rows: Array<Record<string, string | number>> = [];

  const sorted = [...data.lessons].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.start.localeCompare(b.start);
  });

  for (const l of sorted) {
    rows.push({
      "יום": DAY_NAMES[l.day as DayKey],
      "התחלה": l.start,
      "סיום": lessonEnd(l),
      "משך (דקות)": LESSON_DURATION[l.type],
      "סוג": l.type === "double" ? "כפול" : "רגיל",
      "תלמידה": l.studentName,
      "כיתה": l.classRoom ?? "",
      "טלפון": l.phone ?? "",
      "מס׳ כרטיסיה": l.cardNumber ?? "",
      "הערות": l.notes ?? "",
    });
  }

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: [
      "יום",
      "התחלה",
      "סיום",
      "משך (דקות)",
      "סוג",
      "תלמידה",
      "כיתה",
      "טלפון",
      "מס׳ כרטיסיה",
      "הערות",
    ],
  });
  ws["!cols"] = [
    { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 8 },
    { wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 30 },
  ];
  ws["!views"] = [{ RTL: true }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "דוח שבועי");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `דוח-שבועי-${date}.xlsx`);
}
