import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { agendaInitial, type AgendaEvent, type EventType } from "@/data/agenda";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda General — Elaboración" },
      { name: "description", content: "Planificación de turnos, mantenimientos y limpiezas CIP." },
    ],
  }),
  component: AgendaPage,
});

const typeColors: Record<EventType, string> = {
  Turno: "bg-blue-500/15 text-blue-700 border-l-2 border-blue-500",
  Mantenimiento: "bg-orange-500/15 text-orange-700 border-l-2 border-orange-500",
  CIP: "bg-emerald-500/15 text-emerald-700 border-l-2 border-emerald-500",
};

const dotColors: Record<EventType, string> = {
  Turno: "bg-blue-500",
  Mantenimiento: "bg-orange-500",
  CIP: "bg-emerald-500",
};

function AgendaPage() {
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>(agendaInitial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ titulo: string; inicio: string; fin: string; tipo: EventType; descripcion: string }>({
    titulo: "",
    inicio: "",
    fin: "",
    tipo: "Turno",
    descripcion: "",
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventsByDay = (d: Date) =>
    events.filter((e) => isSameDay(new Date(e.inicio), d));

  function submit() {
    if (!form.titulo || !form.inicio) return;
    setEvents((prev) => [
      ...prev,
      {
        id: `ev-${Date.now()}`,
        titulo: form.titulo,
        inicio: new Date(form.inicio).toISOString(),
        fin: new Date(form.fin || form.inicio).toISOString(),
        tipo: form.tipo,
        descripcion: form.descripcion,
      },
    ]);
    setOpen(false);
    setForm({ titulo: "", inicio: "", fin: "", tipo: "Turno", descripcion: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda General</h1>
          <p className="text-sm text-muted-foreground">Planificación operativa mensual</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nuevo evento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Título</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Mantenimiento TK-110" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fecha inicio</Label>
                  <Input type="datetime-local" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
                </div>
                <div>
                  <Label>Fecha fin</Label>
                  <Input type="datetime-local" value={form.fin} onChange={(e) => setForm({ ...form, fin: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Tipo de evento</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as EventType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Turno">Turno</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="CIP">Limpieza CIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="capitalize text-lg">
            {format(cursor, "MMMM yyyy", { locale: es })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Hoy</Button>
            <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
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
              const inMonth = isSameMonth(day, cursor);
              const isToday = isSameDay(day, new Date());
              const dayEvents = eventsByDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[110px] bg-card p-2 text-xs",
                    !inMonth && "bg-muted/30 text-muted-foreground",
                  )}
                >
                  <div className={cn(
                    "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday && "bg-primary text-primary-foreground",
                  )}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div key={e.id} className={cn("truncate rounded px-1.5 py-0.5 text-[11px]", typeColors[e.tipo])}>
                        {format(new Date(e.inicio), "HH:mm")} {e.titulo}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            {(["Turno", "Mantenimiento", "CIP"] as EventType[]).map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span className={cn("h-3 w-3 rounded-full", dotColors[t])} />
                <span className="text-muted-foreground">{t === "CIP" ? "Limpieza CIP" : t}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}