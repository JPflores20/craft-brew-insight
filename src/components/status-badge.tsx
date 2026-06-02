import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status =
  | "En Rango"
  | "En Observación"
  | "Desviado"
  | "Mala"
  | "Regular"
  | "Buena"
  | "Alta"
  | "Media"
  | "Baja";

const styles: Record<Status, string> = {
  "En Rango": "bg-status-ok/15 text-status-ok border-status-ok/30",
  Buena: "bg-status-ok/15 text-status-ok border-status-ok/30",
  Baja: "bg-status-ok/15 text-status-ok border-status-ok/30",
  "En Observación": "bg-status-warn/20 text-status-warn border-status-warn/40",
  Regular: "bg-status-warn/20 text-status-warn border-status-warn/40",
  Media: "bg-status-warn/20 text-status-warn border-status-warn/40",
  Desviado: "bg-status-bad/15 text-status-bad border-status-bad/30",
  Mala: "bg-status-bad/15 text-status-bad border-status-bad/30",
  Alta: "bg-status-bad/15 text-status-bad border-status-bad/30",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={cn("font-medium", styles[status])}>
      {status}
    </Badge>
  );
}