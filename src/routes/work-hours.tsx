import { createFileRoute } from "@tanstack/react-router";
import { WorkHoursEditor } from "@/components/WorkHoursEditor";

export const Route = createFileRoute("/work-hours")({
  component: WorkHoursEditor,
});
