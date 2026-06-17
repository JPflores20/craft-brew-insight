import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type AgendaEvent } from "@/types/proceso";
import { Dispatch, SetStateAction } from "react";

const getEventColorClass = (e: any, isDot = false) => {
  if (e.titulo && e.titulo.includes("Purga")) {
    return isDot ? "bg-amber-500" : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-l-2 border-amber-500";
  }
  if (e.titulo && e.titulo.includes("Chequeo Plato 72h")) {
    return isDot ? "bg-violet-500" : "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-l-2 border-violet-500";
  }
};

interface AgendaCalendarProps {
  cursor: Date;
  set_cursor: Dispatch<SetStateAction<Date>>;
  days: Date[];
  events: AgendaEvent[];
}

export function AgendaCalendar({ cursor, set_cursor, days, events }: AgendaCalendarProps) {
  const events_by_day = (d: Date) => events.filter((e) => {
    if (!isSameDay(new Date(e.inicio), d)) return false;
    // Filtrar eventos de Plato que NO sean de 72h
    if (e.titulo.includes("Medir Plato") && !e.titulo.includes("72h")) return false;
    return true;
  });

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
                    <div key={e.id} className={cn("whitespace-normal break-words leading-tight rounded px-1.5 py-1 text-[11px]", getEventColorClass(e))}>
                      <span className="font-semibold">{format(new Date(e.inicio), "HH:mm")}</span> - {e.titulo}
                    </div>
                  ))}
                  {day_events.length > 3 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-[10px] font-medium text-muted-foreground hover:text-primary hover:underline transition-colors w-full text-left pt-1">
                          +{day_events.length - 3} más
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Agenda del {format(day, "d 'de' MMMM", { locale: es })}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 mt-2">
                          {day_events.map(e => (
                            <div key={e.id} className={cn("rounded-lg p-3 border", getEventColorClass(e))}>
                              <div className="font-bold flex items-center gap-2">
                                <span className={cn("h-2.5 w-2.5 rounded-full", getEventColorClass(e, true))} />
                                {format(new Date(e.inicio), "HH:mm")} - {e.titulo}
                              </div>
                              {e.descripcion && (
                                <p className="mt-1 text-sm opacity-90">{e.descripcion}</p>
                              )}
                              {e.turno && (
                                <div className="mt-1 text-xs font-semibold opacity-75">
                                  {e.turno}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          {[
            { label: "Chequeo Plato 72h", tipo: "Turno", titulo: "Chequeo Plato 72h" },
            { label: "Purga de Trub", tipo: "Purga", titulo: "Purga" }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={cn("h-3 w-3 rounded-full", getEventColorClass(item, true))} />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
