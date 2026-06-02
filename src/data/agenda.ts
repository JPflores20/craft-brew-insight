export type EventType = "Turno" | "Mantenimiento" | "CIP";

export interface AgendaEvent {
  id: string;
  titulo: string;
  inicio: string; // ISO date
  fin: string;
  tipo: EventType;
  descripcion?: string;
}

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();

function iso(day: number, hour = 8) {
  const d = new Date(y, m, day, hour, 0, 0);
  return d.toISOString();
}

export const agendaInitial: AgendaEvent[] = [
  { id: "ev1", titulo: "Turno Mañana - Equipo A", inicio: iso(2, 6), fin: iso(2, 14), tipo: "Turno", descripcion: "Operadores: Pérez, García, Rodríguez" },
  { id: "ev2", titulo: "Mantenimiento TK-105", inicio: iso(4, 9), fin: iso(4, 13), tipo: "Mantenimiento", descripcion: "Revisión de válvulas y sensores de temperatura" },
  { id: "ev3", titulo: "CIP Línea de Llenado", inicio: iso(5, 22), fin: iso(6, 4), tipo: "CIP", descripcion: "Limpieza profunda con sosa cáustica" },
  { id: "ev4", titulo: "Turno Tarde - Equipo B", inicio: iso(7, 14), fin: iso(7, 22), tipo: "Turno" },
  { id: "ev5", titulo: "Mantenimiento Intercambiador", inicio: iso(9, 8), fin: iso(9, 16), tipo: "Mantenimiento" },
  { id: "ev6", titulo: "CIP Tanques 110-115", inicio: iso(11, 20), fin: iso(12, 2), tipo: "CIP" },
  { id: "ev7", titulo: "Turno Noche - Equipo C", inicio: iso(12, 22), fin: iso(13, 6), tipo: "Turno" },
  { id: "ev8", titulo: "Mantenimiento Preventivo Bombas", inicio: iso(15, 9), fin: iso(15, 12), tipo: "Mantenimiento" },
  { id: "ev9", titulo: "CIP Filtros", inicio: iso(18, 19), fin: iso(18, 23), tipo: "CIP" },
  { id: "ev10", titulo: "Turno Mañana - Equipo A", inicio: iso(20, 6), fin: iso(20, 14), tipo: "Turno" },
  { id: "ev11", titulo: "Mantenimiento Cocción", inicio: iso(23, 8), fin: iso(23, 18), tipo: "Mantenimiento" },
  { id: "ev12", titulo: "CIP General Semanal", inicio: iso(26, 22), fin: iso(27, 6), tipo: "CIP" },
];