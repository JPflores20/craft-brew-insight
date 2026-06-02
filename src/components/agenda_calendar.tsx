import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type AgendaEvent, type EventType } from "@/data/agenda";
import { Dispatch, SetStateAction } from "react";

const type_colors: Record<EventType, string> = {
  Turno: "bg-blue-500/15 text-blue-700 border-l-2 border-blue-500",
  Mantenimiento: "bg-orange-500/15 text-orange-700 border-l-2 border-orange-500",
  CIP: "bg-emerald-500/15 text-emerald-700 border-l-2 border-emerald-500",
};

const dot_colors: Record<EventType, string> = {
  Turno: "bg-blue-500",
  Mantenimiento: "bg-orange-500",
  CIP: "bg-emerald-500",
};

interface AgendaCalendarProps {
  cursor: Date;
  set_cursor: Dispatch<SetStateAction<Date>>;
  days: Date[];
  events: AgendaEvent[];
}

export function AgendaCalendar({ cursor, set_cursor, days, events }: AgendaCalendarProps) {
  const events_by_day = (d: Date) => events.filter((e) => isSameDay(new Date(e.inicio), d));

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="capitalize text-lg">
          {format(cursor, "MMMM yyyy", { locale: es })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => set_cursor(subMonths(cursor, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => set_cursor(new Date())}>Hoy</Button>
          <Button variant="outline" size="icon" onClick={() => set_cursor(addMonths(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden border">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div key={d} className="bg-secondary py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
          ))}
          {days.map((day) => {
            const in_month = isSameMonth(day, cursor);
            const is_today = isSameDay(day, new Date());
            const day_events = events_by_day(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[110px] bg-card p-2 text-xs",
                  !in_month && "bg-muted/30 text-muted-foreground",
                )}
              >
                <div className={cn(
                  "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  is_today && "bg-primary text-primary-foreground",
                )}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {day_events.slice(0, 3).map((e) => (
                    <div key={e.id} className={cn("truncate rounded px-1.5 py-0.5 text-[11px]", type_colors[e.tipo])}>
                      {format(new Date(e.inicio), "HH:mm")} {e.titulo}
                    </div>
                  ))}
                  {day_events.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">+{day_events.length - 3} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          {(["Turno", "Mantenimiento", "CIP"] as EventType[]).map((t) => (
            <div key={t} className="flex items-center gap-2">
              <span className={cn("h-3 w-3 rounded-full", dot_colors[t])} />
              <span className="text-muted-foreground">{t === "CIP" ? "Limpieza CIP" : t}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
