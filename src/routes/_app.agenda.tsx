import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { AgendaDialog } from "@/components/agenda_dialog";
import { AgendaCalendar } from "@/components/agenda_calendar";
import { useOperacionesStore } from "@/store/useOperacionesStore";
import type { AgendaFormValues } from "@/lib/schemas/operaciones";
import { obtenerTurnoPorHora } from "@/data/turno"; 

export const Route = createFileRoute("/_app/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda General" },
      { name: "description", content: "Purgas y Extractos ." },
    ],
  }),
  component: AgendaPage,
});

function AgendaPage() {
  const { eventosAgenda, extractos, addEventoAgenda } = useOperacionesStore();
  const [cursor, set_cursor] = useState(new Date());
  const [open, set_open] = useState(false);
 

  const [turnoSeleccionado, set_turnoSeleccionado] = useState<string>("TODOS");

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventosFiltrados = useMemo(() => {
    // Derivar eventos de purga desde extractos (misma lógica que la pantalla de Purgas)
    const purgasEventos = extractos.flatMap((e) => {
      const fechaBase = e.fechaLlenado ? new Date(e.fechaLlenado) : null;
      if (!fechaBase) return [];
      // Solo la Purga 8 (8 * 8 = 64 horas después del llenado)
      const fechaPurga8 = new Date(fechaBase.getTime() + 8 * 8 * 60 * 60 * 1000);
      return [{
        id: `purga-${e.id}-8`,
        titulo: `Purga 8 - Tanque ${e.tanque}`,
        inicio: fechaPurga8.toISOString(),
        fin: fechaPurga8.toISOString(),
        tipo: "Purga" as const,
        descripcion: `Marca: ${e.marca}`,
        turno: obtenerTurnoPorHora(fechaPurga8.toISOString()),
        completado: false,
      }];
    });

    // Calcular "completado" para eventosAgenda (Chequeo Plato)
    const eventosMapeados = eventosAgenda.map((evento: any) => {
      let completado = false;
      let extractoId: string | undefined = undefined;
      if (evento.titulo?.includes("Chequeo Plato 72h")) {
        const match = evento.titulo.match(/Tanque\s+([\w-]+)/i);
        if (match) {
          const tanque = match[1];
          const extracto = extractos.find((e) => e.tanque === tanque);
          if (extracto) {
            extractoId = extracto.id;
            if (extracto.estado72h === "Completado") {
              completado = true;
            }
          }
        }
      }
      return { ...evento, completado, extractoId };
    });

    const todosLosEventos = [...eventosMapeados, ...purgasEventos];

    if (turnoSeleccionado === "TODOS") return todosLosEventos;
    return todosLosEventos.filter((evento: any) => evento.turno === turnoSeleccionado);
  }, [eventosAgenda, extractos, turnoSeleccionado]);


  function submit(data: AgendaFormValues) {
    const turnoAsignado = obtenerTurnoPorHora(data.inicio);

    addEventoAgenda({
      id: `ev-${Date.now()}`,
      titulo: data.titulo,
      inicio: new Date(data.inicio).toISOString(),
      fin: new Date(data.fin || data.inicio).toISOString(),
      tipo: data.tipo,
      descripcion: data.descripcion,
      turno: turnoAsignado, 
    } as any);
    set_open(false);
  }

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda General</h1>
          <p className="text-sm text-muted-foreground">Planificación operativa por turnos</p>
        </div>
        <div className="flex items-center gap-2">
          <AgendaDialog 
            open={open} 
            set_open={set_open} 
            submit={submit} 
          />
        </div>
      </div>

      {/*SELECCIÓN DE TURNO */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex bg-muted p-1 rounded-lg gap-1 border text-sm">
          {(["TODOS", "Turno 1", "Turno 2", "Turno 3"] as string[]).map((turno) => (
            <button
              key={turno}
              type="button"
              onClick={() => set_turnoSeleccionado(turno)}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                turnoSeleccionado === turno
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
              }`}
            >
              {turno === "TODOS" ? "Ver Todo" : turno}
            </button>
          ))}
        </div>

        {/**/}
        {turnoSeleccionado !== "TODOS" && (
          <span className="text-xs text-muted-foreground animate-fade-in bg-secondary px-3 py-1.5 rounded-full font-medium">
            Mostrando solo purgas y actividades del <strong className="text-primary">{turnoSeleccionado}</strong>
          </span>
        )}
      </div>

      {/* Calendario con los datos ya filtrados */}
      <AgendaCalendar 
        cursor={cursor} 
        set_cursor={set_cursor} 
        days={days} 
        events={eventosFiltrados}
      />
    </div>
  );
}
