import { parseMexicanDate } from "@/lib/utils";

export type TipoTurno = 'Turno 1' | 'Turno 2' | 'Turno 3';

export function obtenerTurnoPorHora(fechaInput: Date | string): TipoTurno | null {
  const fecha = parseMexicanDate(fechaInput);
  if (!fecha) return null;

  const hora = fecha.getHours();
  const minutos = fecha.getMinutes();

  const minutosTotales = hora * 60 + minutos;

  const inicioT2 = 6 * 60;          // 06:00
  const inicioT3 = 15 * 60 + 30;    // 15:30
  const inicioT1 = 23 * 60;         // 23:00

  if (minutosTotales >= inicioT2 && minutosTotales < inicioT3) {
    return 'Turno 2';
  } else if (minutosTotales >= inicioT3 && minutosTotales < inicioT1) {
    return 'Turno 3';
  } else {
    // Cubre de 23:00 a 23:59 y de 00:00 a 05:59 del día siguiente
    return 'Turno 1';
  }
}