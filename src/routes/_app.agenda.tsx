import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { agendaInitial, type AgendaEvent, type EventType } from "@/data/agenda";
import { AgendaDialog } from "@/components/agenda_dialog";
import { AgendaCalendar } from "@/components/agenda_calendar";

export const Route = createFileRoute("/_app/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda General — Elaboración" },
      { name: "description", content: "Planificación de turnos, mantenimientos y limpiezas CIP." },
    ],
  }),
  component: AgendaPage,
});

function AgendaPage() {
  const [cursor, set_cursor] = useState(new Date());
  const [events, set_events] = useState<AgendaEvent[]>(agendaInitial);
  const [open, set_open] = useState(false);
  const [form, set_form] = useState<{ titulo: string; inicio: string; fin: string; tipo: EventType; descripcion: string }>({
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

  function submit() {
    if (!form.titulo || !form.inicio) return;
    set_events((prev) => [
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
    set_open(false);
    set_form({ titulo: "", inicio: "", fin: "", tipo: "Turno", descripcion: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda General</h1>
          <p className="text-sm text-muted-foreground">Planificación operativa mensual</p>
        </div>
        <AgendaDialog 
          open={open} 
          set_open={set_open} 
          form={form} 
          set_form={set_form} 
          submit={submit} 
        />
      </div>

      <AgendaCalendar 
        cursor={cursor} 
        set_cursor={set_cursor} 
        days={days} 
        events={events} 
      />
    </div>
  );
}