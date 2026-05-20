import { Link, useLocation } from "@tanstack/react-router";
import { Calendar, Clock, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportWeeklyExcel } from "@/lib/excel";
import { useAppData } from "@/lib/useAppData";
import { toast } from "sonner";

export function AppHeader() {
  const location = useLocation();
  const { data } = useAppData();

  const handleExport = () => {
    if (data.lessons.length === 0) {
      toast.error("אין שיעורים לייצא");
      return;
    }
    exportWeeklyExcel(data);
    toast.success("הדוח יוצא בהצלחה");
  };

  const navLink = (to: string, label: string, Icon: typeof Calendar) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          active
            ? "bg-primary text-primary-foreground shadow-glow"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">יומן שיעורים</span>
            <span className="text-[11px] text-muted-foreground">לוח זמנים לתלמידות</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navLink("/", "לוח זמנים", Calendar)}
          {navLink("/work-hours", "זמני עבודה", Clock)}
        </nav>

        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="gap-2 border-primary/40 hover:bg-primary/10 hover:text-primary"
        >
          <Download className="h-4 w-4" />
          ייצוא לאקסל
        </Button>
      </div>
    </header>
  );
}
