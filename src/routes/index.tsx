import { createFileRoute } from "@tanstack/react-router";
import { ScheduleView } from "@/components/ScheduleView";

export const Route = createFileRoute("/")({
  component: ScheduleView,
});
