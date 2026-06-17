import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { AgendaCalendar } from "@/components/agenda_calendar";
import { useOperacionesStore } from "@/store/useOperacionesStore";
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
  const { eventosAgenda, extractos } = useOperacionesStore();
  const [cursor, set_cursor] = useState(new Date());

  const [turnoSeleccionado, set_turnoSeleccionado] = useState<string>(() => obtenerTurnoPorHora(new Date().toISOString()) || "TODOS");
  const [purgaSeleccionada, set_purgaSeleccionada] = useState<number>(8);

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
      
      const fechaPurga = new Date(fechaBase.getTime() + purgaSeleccionada * 8 * 60 * 60 * 1000);
      return [{
        id: `purga-${e.id}-${purgaSeleccionada}`,
        titulo: `Purga ${purgaSeleccionada} - Tanque ${e.tanque}`,
        inicio: fechaPurga.toISOString(),
        fin: fechaPurga.toISOString(),
        tipo: "Purga" as const,
        descripcion: `Marca: ${e.marca}`,
        turno: obtenerTurnoPorHora(fechaPurga.toISOString()),
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

    const todosLosEventos = [...eventosMapeados.filter(e => !e.titulo?.includes("Purga")), ...purgasEventos];

    if (turnoSeleccionado === "TODOS") return todosLosEventos;
    return todosLosEventos.filter((evento: any) => evento.turno === turnoSeleccionado);
  }, [eventosAgenda, extractos, turnoSeleccionado, purgaSeleccionada]);


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Agenda General</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Planificación operativa por turnos</p>
        </div>
        
        {/*SELECCIÓN DE TURNO Y PURGA */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purga Nº:</span>
            <select
              value={purgaSeleccionada}
              onChange={(e) => set_purgaSeleccionada(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>Purga {num}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100/80 p-1.5 rounded-xl gap-1">
            {(["TODOS", "Turno 1", "Turno 2", "Turno 3"] as string[]).map((turno) => (
              <button
                key={turno}
                type="button"
                onClick={() => set_turnoSeleccionado(turno)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all duration-300 ${
                  turnoSeleccionado === turno
                    ? "bg-white text-slate-800 shadow-sm font-bold scale-105"
                    : "text-slate-500 font-semibold hover:bg-white/50 hover:text-slate-700"
                }`}
              >
                {turno === "TODOS" ? "Ver Todo" : turno}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendario con los datos ya filtrados */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
        <AgendaCalendar 
          cursor={cursor} 
          set_cursor={set_cursor} 
          days={days} 
          events={eventosFiltrados}
        />
      </div>
    </div>
  );
}
