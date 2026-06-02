import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "ok" | "warn" | "bad";
  hint?: string;
}

const toneMap = {
  default: "text-foreground bg-secondary",
  ok: "text-status-ok bg-status-ok/10",
  warn: "text-status-warn bg-status-warn/15",
  bad: "text-status-bad bg-status-bad/10",
};

export function KpiCard({ label, value, icon: Icon, tone = "default", hint }: Props) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", toneMap[tone])}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className={cn("text-2xl font-bold leading-tight", tone === "bad" && "text-status-bad")}>
            {value}
          </span>
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}